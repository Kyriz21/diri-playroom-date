/** Browser webcam capture for arcade avatars. Gallery selection stays separate. */
export function createAvatarCamera(root, { onCapture, onNotice = () => {} } = {}) {
  let stream = null;
  let destroyed = false;
  let busy = false;
  let overlay = root.querySelector('[data-avatar-camera-modal]');

  if (!overlay) {
    root.insertAdjacentHTML('beforeend', `
      <div class="arcade-camera-overlay" data-avatar-camera-modal hidden>
        <section class="arcade-camera-dialog" role="dialog" aria-modal="true" aria-labelledby="arcade-camera-title">
          <header class="arcade-camera-header">
            <div><span class="arcade-camera-kicker">KAMERA PERANGKAT</span><h2 id="arcade-camera-title">Ambil foto karakter</h2></div>
            <button type="button" class="arcade-camera-close" data-avatar-camera-action="close" aria-label="Tutup kamera">×</button>
          </header>
          <div class="arcade-camera-preview"><video data-avatar-camera-video autoplay muted playsinline></video><span class="arcade-camera-guide" aria-hidden="true"></span></div>
          <p class="arcade-camera-status" data-avatar-camera-status>Izinkan akses kamera untuk mengambil foto.</p>
          <div class="arcade-camera-actions">
            <button type="button" class="button button-secondary" data-avatar-camera-action="close">Batal</button>
            <button type="button" class="button button-primary" data-avatar-camera-action="capture" disabled>Ambil foto</button>
          </div>
        </section>
      </div>`);
    overlay = root.querySelector('[data-avatar-camera-modal]');
  }

  const video = overlay?.querySelector('[data-avatar-camera-video]');
  const status = overlay?.querySelector('[data-avatar-camera-status]');
  const captureButton = overlay?.querySelector('[data-avatar-camera-action="capture"]');

  function stopStream() {
    if (stream) stream.getTracks().forEach(track => track.stop());
    stream = null;
    if (video) video.srcObject = null;
    if (captureButton) captureButton.disabled = true;
  }

  function close() {
    stopStream();
    if (overlay) overlay.hidden = true;
    busy = false;
  }

  function permissionMessage(error) {
    if (error?.name === 'NotAllowedError' || error?.name === 'PermissionDeniedError') {
      return 'Izin kamera ditolak. Izinkan kamera untuk situs GitHub Pages ini melalui pengaturan browser.';
    }
    if (error?.name === 'NotFoundError' || error?.name === 'DevicesNotFoundError') {
      return 'Kamera tidak ditemukan pada perangkat ini. Kamu masih bisa memilih foto dari galeri.';
    }
    if (error?.name === 'NotReadableError' || error?.name === 'TrackStartError') {
      return 'Kamera sedang digunakan aplikasi lain. Tutup aplikasi tersebut lalu coba lagi.';
    }
    if (!window.isSecureContext) {
      return 'Kamera memerlukan koneksi aman HTTPS. Buka website melalui alamat GitHub Pages.';
    }
    return error?.message || 'Kamera tidak dapat dibuka. Periksa izin dan sambungan kamera.';
  }

  async function open() {
    if (destroyed || busy) return;
    if (!navigator.mediaDevices?.getUserMedia) {
      onNotice('Browser ini tidak menyediakan akses kamera. Gunakan HTTPS dan browser terbaru.', 'error');
      return;
    }
    if (!window.isSecureContext) {
      onNotice(permissionMessage({ name: 'InsecureContextError' }), 'error');
      return;
    }

    busy = true;
    if (overlay) overlay.hidden = false;
    if (status) status.textContent = 'Menghubungkan kamera…';
    try {
      stopStream();
      stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: 'user' },
          width: { ideal: 960 },
          height: { ideal: 720 }
        }
      });
      if (destroyed) { stopStream(); return; }
      video.srcObject = stream;
      video.muted = true;
      video.playsInline = true;
      await video.play();
      if (status) status.textContent = 'Posisikan wajah di tengah, lalu tekan Ambil foto.';
      if (captureButton) captureButton.disabled = false;
    } catch (error) {
      close();
      onNotice(permissionMessage(error), 'error', { duration: 4200 });
    } finally {
      busy = false;
    }
  }

  async function capture() {
    if (destroyed || busy || !stream || !video?.videoWidth || !video?.videoHeight) {
      onNotice('Kamera belum siap. Tunggu sampai pratinjau kamera terlihat.', 'error');
      return;
    }
    busy = true;
    if (captureButton) captureButton.disabled = true;
    if (status) status.textContent = 'Memproses foto…';
    try {
      const maxSide = 960;
      const scale = Math.min(1, maxSide / Math.max(video.videoWidth, video.videoHeight));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
      canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
      const context = canvas.getContext('2d', { alpha: false });
      if (!context) throw new Error('Tidak dapat menyiapkan gambar kamera.');
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob(result => result ? resolve(result) : reject(new Error('Foto kamera gagal diproses.')), 'image/jpeg', 0.86);
      });
      const file = typeof File === 'function'
        ? new File([blob], `avatar-${Date.now()}.jpg`, { type: 'image/jpeg', lastModified: Date.now() })
        : blob;
      await onCapture?.(file);
      close();
    } catch (error) {
      if (status) status.textContent = error?.message || 'Foto belum berhasil diproses.';
      if (captureButton) captureButton.disabled = false;
      onNotice(error?.message || 'Foto kamera gagal diproses.', 'error');
    } finally {
      busy = false;
    }
  }

  function clickHandler(event) {
    const action = event.target.closest('[data-avatar-camera-action]')?.dataset.avatarCameraAction;
    if (action === 'close') close();
    if (action === 'capture') void capture();
    if (event.target === overlay) close();
  }

  function keyHandler(event) {
    if (event.key === 'Escape' && overlay && !overlay.hidden) close();
  }

  root.addEventListener('click', clickHandler);
  root.addEventListener('keydown', keyHandler);

  return {
    open,
    close,
    destroy() {
      destroyed = true;
      close();
      root.removeEventListener('click', clickHandler);
      root.removeEventListener('keydown', keyHandler);
      overlay?.remove();
    }
  };
}
