document.addEventListener('DOMContentLoaded', function () {
    const data = JSON.parse(localStorage.getItem('dataWarga') || '[]');

    const targetLapor = data.length;
    const targetSelesai = data.filter(item => item.status === 'selesai').length;
    const targetAktif = data.filter(item => item.status !== 'selesai').length;

    function animate(id, target) {
        const el = document.getElementById(id);
        if (!el) return;
        if (target <= 0) { el.innerText = 0; return; }

        let count = 0;
        const interval = setInterval(() => {
            count++;
            el.innerText = count;
            if (count >= target) clearInterval(interval);
        }, 80);
    }

    animate('totalLapor', targetLapor);
    animate('totalSelesai', targetSelesai);

    const elAktif = document.getElementById('totalAktif');
    if (elAktif) elAktif.innerText = targetAktif;
});
