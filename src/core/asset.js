// ==========================================
// Helper d'affichage des sprites de chat : un asset peut être soit un emoji
// (chaîne courte), soit une image détourée (data URL PNG générée depuis une photo).
// ==========================================

export function isImageAsset(a) {
  return (
    typeof a === 'string' &&
    (a.startsWith('data:') || a.startsWith('/') || a.startsWith('http'))
  );
}

// Renvoie le HTML pour afficher un asset inline (emoji texte ou <img>).
export function assetMarkup(a, size = 24) {
  if (isImageAsset(a)) {
    return `<img class="asset-img" src="${a}" alt="" style="width:${size}px;height:${size}px;object-fit:contain;vertical-align:middle;">`;
  }
  return a || '';
}

// Affiche un asset dans un élément (emoji via texte, image via <img>).
export function setAssetEl(el, a) {
  if (isImageAsset(a)) {
    el.textContent = '';
    el.innerHTML = `<img class="sprite-img" src="${a}" alt="">`;
  } else {
    el.innerHTML = '';
    el.textContent = a || '';
  }
}

// Détoure le sujet d'une photo (fond retiré) et renvoie un data URL PNG réduit.
export async function photoToSprite(file, max = 128) {
  const { removeBackground } = await import('@imgly/background-removal');
  const cutout = await removeBackground(file);
  return blobToDataUrl(cutout, max);
}

function blobToDataUrl(blob, max) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      // Image détourée à sa taille naturelle.
      const nat = document.createElement('canvas');
      nat.width = img.width;
      nat.height = img.height;
      const nctx = nat.getContext('2d');
      nctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(img.src);

      // Recadre sur la zone non transparente (le sujet) pour ignorer les marges vides.
      const box = alphaBounds(nctx, img.width, img.height);

      // Met à l'échelle pour remplir `max` (agrandit si le sujet est petit).
      const scale = Math.min(max / box.w, max / box.h);
      const w = Math.max(1, Math.round(box.w * scale));
      const h = Math.max(1, Math.round(box.h * scale));
      const out = document.createElement('canvas');
      out.width = w;
      out.height = h;
      out.getContext('2d').drawImage(nat, box.x, box.y, box.w, box.h, 0, 0, w, h);
      resolve(out.toDataURL('image/png'));
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(blob);
  });
}

// Boîte englobante des pixels visibles (alpha > seuil), avec petite marge.
function alphaBounds(ctx, w, h, thresh = 12) {
  const data = ctx.getImageData(0, 0, w, h).data;
  let minX = w, minY = h, maxX = -1, maxY = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (data[(y * w + x) * 4 + 3] > thresh) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) return { x: 0, y: 0, w, h }; // tout transparent : on garde tout
  const pad = 2;
  minX = Math.max(0, minX - pad);
  minY = Math.max(0, minY - pad);
  maxX = Math.min(w - 1, maxX + pad);
  maxY = Math.min(h - 1, maxY + pad);
  return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
}
