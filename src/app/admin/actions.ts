"use server";

import { updateTag } from "next/cache";
import { redirect, unstable_rethrow } from "next/navigation";
import { checkPassword, endSession, requireAdmin, startSession } from "@/lib/auth";
import { CATEGORIES, HERO_SLOTS, type HomeMedia, SERVICES, VIBES, type ServiceKey, slugify } from "@/lib/constants";
import { cleanBookedDates } from "@/lib/availability";
import { normalizeInstagram, normalizeMessenger, normalizeZalo } from "@/lib/contacts";
import { CONTENT_TAG } from "@/lib/content";
import * as db from "@/lib/db";
import { deleteImages, saveImages } from "@/lib/uploads";

export type FormState = { error?: string; ok?: string };

// ---------- Tiện ích đọc form ----------
const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const int = (fd: FormData, k: string) => {
  const n = Number(str(fd, k).replace(/[^\d]/g, ""));
  return Number.isFinite(n) ? n : 0;
};
const bool = (fd: FormData, k: string) => fd.get(k) === "on";
const pick = (fd: FormData, k: string, allowed: readonly string[]) =>
  fd.getAll(k).map(String).filter((v) => allowed.includes(v));
const lines = (s: string) =>
  s
    .split(/\r?\n/)
    .map((x) => x.trim())
    .filter(Boolean);

const safeJson = (s: string): unknown => {
  try {
    return JSON.parse(s);
  } catch {
    return [];
  }
};

const done = () => updateTag(CONTENT_TAG);

/**
 * Gộp ảnh: giữ các ảnh cũ còn trong form (đúng thứ tự), thêm link ảnh và file mới tải lên.
 * Trả về danh sách mới + các ảnh đã bị bỏ (để xoá file sau khi lưu xong).
 */
async function resolvePhotos(fd: FormData, old: string[], max?: number, field = "") {
  const keep = fd
    .getAll(`${field}keep`)
    .map(String)
    .filter((u) => old.includes(u));
  const links = lines(str(fd, `${field}urls`)).filter((u) => /^https?:\/\//.test(u));
  const files = fd.getAll(`${field}files`).filter((f): f is File => f instanceof File && f.size > 0);
  const uploaded = await saveImages(files);
  let photos = [...keep, ...links, ...uploaded];
  if (max) {
    // Chỉ một ảnh: ảnh mới thay ảnh cũ
    photos = [...uploaded, ...links, ...keep].slice(0, max);
  }
  const removed = old.filter((u) => !photos.includes(u));
  const unused = uploaded.filter((u) => !photos.includes(u));
  return { photos, removed: [...removed, ...unused], uploaded };
}

async function guarded(fn: () => Promise<FormState | void>): Promise<FormState> {
  await requireAdmin();
  try {
    return (await fn()) ?? {};
  } catch (e) {
    // redirect() của Next.js cũng ném lỗi — phải ném tiếp để chuyển trang
    unstable_rethrow(e);
    console.error(e);
    return { error: e instanceof Error ? e.message : "Có lỗi xảy ra, thử lại nhé." };
  }
}

// ---------- Đăng nhập ----------
export async function loginAction(_: FormState, fd: FormData): Promise<FormState> {
  const ok = checkPassword(str(fd, "password"));
  if (!ok) {
    await new Promise((r) => setTimeout(r, 1000)); // làm chậm đoán mật khẩu
    return { error: "Sai mật khẩu." };
  }
  await startSession();
  redirect("/admin");
}

export async function logoutAction() {
  await endSession();
  redirect("/admin/login");
}

// ---------- Photographer ----------
export async function savePhotographer(id: number | null, _: FormState, fd: FormData): Promise<FormState> {
  return guarded(async () => {
    const name = str(fd, "name");
    if (!name) return { error: "Chưa nhập tên." };
    const slug = slugify(str(fd, "slug") || name);
    if (!slug) return { error: "Đường dẫn (slug) không hợp lệ." };
    if (await db.slugTaken("photographers", slug, id ?? undefined)) return { error: `Đường dẫn "${slug}" đã có người dùng.` };
    const tier = str(fd, "tier");
    if (!await db.getTier(tier)) return { error: "Chưa chọn hạng." };

    const old = id ? await db.getPhotographerById(id) : undefined;
    if (id && !old) return { error: "Không tìm thấy photographer." };
    const gallery = await resolvePhotos(fd, old?.photos ?? []);
    const qr = await resolvePhotos(fd, old?.zaloQr ? [old.zaloQr] : [], 1, "qr_").catch(async (e) => {
      await deleteImages(gallery.uploaded); // ảnh portfolio vừa tải lên không còn dùng
      throw e;
    });
    const photos = gallery.photos;
    const uploaded = [...gallery.uploaded, ...qr.uploaded];
    const removed = [...gallery.removed, ...qr.removed];

    const services = Object.fromEntries(SERVICES.map((s) => [s.key, bool(fd, `svc_${s.key}`)])) as Record<ServiceKey, boolean>;
    const data = {
      slug,
      name,
      tier,
      city: str(fd, "city"),
      rating: Math.min(5, Math.max(0, Number(str(fd, "rating").replace(",", ".")) || 0)),
      sessions: int(fd, "sessions"),
      priceFrom: int(fd, "priceFrom"),
      vibes: pick(fd, "vibes", VIBES),
      categories: pick(fd, "categories", CATEGORIES),
      services,
      availability: old?.availability ?? "", // ô chữ cũ, giữ nguyên
      bookedDates: cleanBookedDates(safeJson(str(fd, "bookedDates"))),
      bio: str(fd, "bio"),
      albumUrl: str(fd, "albumUrl"),
      featured: bool(fd, "featured"),
      photos,
      zalo: normalizeZalo(str(fd, "zalo")),
      messenger: normalizeMessenger(str(fd, "messenger")),
      instagram: normalizeInstagram(str(fd, "instagram")),
      zaloQr: qr.photos[0] ?? "",
    };
    try {
      if (id) await db.updatePhotographer(id, data);
      else await db.createPhotographer(data);
    } catch (e) {
      await deleteImages(uploaded);
      throw e;
    }
    await deleteImages(removed);
    done();
    redirect("/admin/photographers");
  });
}

export async function deletePhotographerAction(id: number): Promise<FormState> {
  return guarded(async () => {
    const p = await db.getPhotographerById(id);
    if (!p) return;
    await db.deletePhotographer(id);
    await deleteImages([...p.photos, ...(p.zaloQr ? [p.zaloQr] : [])]);
    done();
  });
}

// ---------- Gói chụp ----------
export async function savePackage(id: number | null, _: FormState, fd: FormData): Promise<FormState> {
  return guarded(async () => {
    const name = str(fd, "name");
    if (!name) return { error: "Chưa nhập tên gói." };
    const old = id ? await db.getPackage(id) : undefined;
    if (id && !old) return { error: "Không tìm thấy gói." };
    const { photos, removed, uploaded } = await resolvePhotos(fd, old?.image ? [old.image] : [], 1);
    const data = {
      name,
      category: str(fd, "category"),
      price: int(fd, "price"),
      description: str(fd, "description"),
      includes: lines(str(fd, "includes")),
      image: photos[0] ?? "",
      featured: bool(fd, "featured"),
    };
    try {
      if (id) await db.updatePackage(id, data);
      else await db.createPackage(data);
    } catch (e) {
      await deleteImages(uploaded);
      throw e;
    }
    await deleteImages(removed);
    done();
    redirect("/admin/packages");
  });
}

export async function deletePackageAction(id: number): Promise<FormState> {
  return guarded(async () => {
    const p = await db.getPackage(id);
    if (!p) return;
    await db.deletePackage(id);
    await deleteImages([p.image]);
    done();
  });
}

// ---------- Đồ bán kèm ----------
export async function saveAddon(id: number | null, _: FormState, fd: FormData): Promise<FormState> {
  return guarded(async () => {
    const name = str(fd, "name");
    if (!name) return { error: "Chưa nhập tên sản phẩm." };
    const old = id ? await db.getAddon(id) : undefined;
    if (id && !old) return { error: "Không tìm thấy sản phẩm." };
    const { photos, removed, uploaded } = await resolvePhotos(fd, old?.image ? [old.image] : [], 1);
    const data = { name, price: int(fd, "price"), description: str(fd, "description"), image: photos[0] ?? "" };
    try {
      if (id) await db.updateAddon(id, data);
      else await db.createAddon(data);
    } catch (e) {
      await deleteImages(uploaded);
      throw e;
    }
    await deleteImages(removed);
    done();
    redirect("/admin/addons");
  });
}

export async function deleteAddonAction(id: number): Promise<FormState> {
  return guarded(async () => {
    const a = await db.getAddon(id);
    if (!a) return;
    await db.deleteAddon(id);
    await deleteImages([a.image]);
    done();
  });
}

// ---------- Trường ----------
export async function saveSchool(id: number | null, _: FormState, fd: FormData): Promise<FormState> {
  return guarded(async () => {
    const name = str(fd, "name");
    if (!name) return { error: "Chưa nhập tên trường." };
    const slug = slugify(str(fd, "slug") || name);
    if (!slug) return { error: "Đường dẫn (slug) không hợp lệ." };
    if (await db.slugTaken("schools", slug, id ?? undefined)) return { error: `Đường dẫn "${slug}" đã có trường khác dùng.` };
    const old = id ? await db.getSchool(id) : undefined;
    if (id && !old) return { error: "Không tìm thấy trường." };
    const { photos, removed, uploaded } = await resolvePhotos(fd, old?.photos ?? []);
    const validSlugs = (await db.listPhotographers()).map((p) => p.slug);
    const data = {
      slug,
      name,
      short: str(fd, "short"),
      type: str(fd, "type"),
      photos,
      photographers: pick(fd, "photographers", validSlugs),
    };
    try {
      if (id) await db.updateSchool(id, data);
      else await db.createSchool(data);
    } catch (e) {
      await deleteImages(uploaded);
      throw e;
    }
    await deleteImages(removed);
    done();
    redirect("/admin/schools");
  });
}

export async function deleteSchoolAction(id: number): Promise<FormState> {
  return guarded(async () => {
    const s = await db.getSchool(id);
    if (!s) return;
    await db.deleteSchool(id);
    await deleteImages(s.photos);
    done();
  });
}

// ---------- Hạng & bảng giá ----------
export async function saveTier(key: string | null, _: FormState, fd: FormData): Promise<FormState> {
  return guarded(async () => {
    const label = str(fd, "label");
    if (!label) return { error: "Chưa nhập tên hạng." };
    const data = { label, priceFrom: int(fd, "priceFrom"), description: str(fd, "description") };
    if (key) {
      await db.updateTier(key, data);
    } else {
      const newKey = slugify(label);
      if (!newKey) return { error: "Tên hạng không hợp lệ." };
      if (await db.getTier(newKey)) return { error: `Đã có hạng "${label}".` };
      await db.createTier({ key: newKey, ...data });
    }
    done();
    return { ok: key ? "Đã lưu." : "Đã thêm hạng." };
  });
}

export async function deleteTierAction(key: string): Promise<FormState> {
  return guarded(async () => {
    const n = await db.countPhotographersInTier(key);
    if (n > 0) return { error: `Còn ${n} photographer thuộc hạng này — đổi hạng cho họ trước khi xoá.` };
    await db.deleteTier(key);
    done();
  });
}

// ---------- Phụ phí tỉnh ----------
export async function saveProvince(id: number | null, _: FormState, fd: FormData): Promise<FormState> {
  return guarded(async () => {
    const name = str(fd, "name");
    if (!name) return { error: "Chưa nhập tên tỉnh." };
    const data = { name, fee: int(fd, "fee") };
    if (id) await db.updateProvince(id, data);
    else await db.createProvince(data);
    done();
    return { ok: id ? "Đã lưu." : "Đã thêm." };
  });
}

export async function deleteProvinceAction(id: number): Promise<FormState> {
  return guarded(async () => {
    await db.deleteProvince(id);
    done();
  });
}

// ---------- Sắp xếp ----------
const MOVABLE = ["photographers", "packages", "addons", "schools", "provinces"] as const;
export async function moveAction(table: (typeof MOVABLE)[number], id: number, dir: -1 | 1): Promise<FormState> {
  return guarded(async () => {
    if (!MOVABLE.includes(table) || (dir !== 1 && dir !== -1)) return { error: "Yêu cầu không hợp lệ." };
    await db.moveRow(table, id, dir);
    done();
  });
}

// ---------- Cài đặt chung ----------
export async function saveSettingsAction(_: FormState, fd: FormData): Promise<FormState> {
  return guarded(async () => {
    const name = str(fd, "name");
    if (!name) return { error: "Tên thương hiệu không được để trống." };
    await db.saveSettings({
      name,
      tagline: str(fd, "tagline"),
      city: str(fd, "city"),
      zalo: str(fd, "zalo"),
      messenger: str(fd, "messenger"),
      instagram: str(fd, "instagram"),
      depositPolicy: str(fd, "depositPolicy"),
    });
    done();
    return { ok: "Đã lưu cài đặt." };
  });
}

// ---------- Ảnh trang chủ ----------
export async function saveHomeMediaAction(_: FormState, fd: FormData): Promise<FormState> {
  return guarded(async () => {
    const old = await db.getHomeMedia();
    const uploaded: string[] = [];
    const removed: string[] = [];
    // Đọc từng ô ảnh; nếu một ô lỗi thì xoá hết ảnh vừa tải lên ở các ô trước
    const field = async (prefix: string, oldPhotos: string[], max?: number) => {
      const r = await resolvePhotos(fd, oldPhotos, max, prefix);
      uploaded.push(...r.uploaded);
      removed.push(...r.removed);
      return r.photos;
    };
    const one = (src: string | undefined) => (src ? [src] : []);

    let media: HomeMedia;
    try {
      const hero = [];
      for (let i = 0; i < HERO_SLOTS; i++) {
        const [photo = ""] = await field(`hero${i}_`, one(old.hero[i]?.photo), 1);
        hero.push({ photo, photographer: str(fd, `hero${i}_photographer`) });
      }
      const strip = await field("strip_", old.strip);
      const vibes: HomeMedia["vibes"] = {};
      for (const [i, vibe] of VIBES.entries()) {
        const [src] = await field(`vibe${i}_`, one(old.vibes[vibe]), 1);
        if (src) vibes[vibe] = src;
      }
      media = { hero, strip, vibes };
      await db.saveHomeMedia(media);
    } catch (e) {
      await deleteImages(uploaded);
      throw e;
    }

    // Không xoá ảnh vẫn đang dùng ở nơi khác (VD dán link ảnh portfolio vào đây rồi bỏ đi)
    const stillUsed = new Set([
      ...media.hero.map((h) => h.photo),
      ...media.strip,
      ...Object.values(media.vibes),
      ...(await db.listPhotographers()).flatMap((p) => [...p.photos, p.zaloQr]),
      ...(await db.listSchools()).flatMap((s) => s.photos),
    ]);
    await deleteImages(removed.filter((u) => !stillUsed.has(u)));
    done();
    return { ok: "Đã lưu ảnh trang chủ." };
  });
}
