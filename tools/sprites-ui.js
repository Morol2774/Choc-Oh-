document.getElementById('go').addEventListener('click', async () => {
  const st = document.getElementById('status'), out = document.getElementById('out');
  out.textContent = ''; st.textContent = 'рендерю…';
  const res = await window.ChocSprites.renderSprites({ onProgress: (i, n) => { st.textContent = i + ' / ' + n; } });
  res.forEach(r => {
    const row = document.createElement('div'); row.className = 'row';
    const img = new Image(); img.src = r.preview; img.alt = r.name;
    const a = document.createElement('a'); a.href = URL.createObjectURL(r.blob); a.download = r.name;
    a.textContent = r.name + ' · ' + Math.round(r.blob.size / 1024) + ' КБ — скачать';
    row.append(img, a); out.append(row);
  });
  st.textContent = 'готово';
});
