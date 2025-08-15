const loadComments = async () => {
    const commentsContainer = document.getElementById('commentsContainer');
    if (!commentsContainer) return;

    try {
        // Yükleme durumunu göster
        commentsContainer.innerHTML = `
            <div class="loading-container">
                <div class="spinner"></div>
                <div>Yorumlar yükleniyor...</div>
            </div>
        `;

        const response = await fetch('/Comment/GetComments?t=' + new Date().getTime(), {
            cache: 'no-cache',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        // HTTP hata durumlarını yakala
        if (!response.ok) {
            throw new Error(`Yorumlar alınamadı (HTTP ${response.status})`);
        }

        const comments = await response.json();

        // Yorum yoksa bilgi mesajı göster
        if (!comments || comments.length === 0) {
            commentsContainer.innerHTML = `
                <div class="no-comments-message">
                    Henüz yorum yapılmamış. İlk yorumu siz yapın!
                </div>
            `;
            return;
        }

        // Container'ı temizle
        commentsContainer.innerHTML = '';

        // Yorumları ters sırada göster (en yeni üstte)
        comments.forEach(comment => {
            const commentDiv = document.createElement('div');
            commentDiv.className = 'comment-item';

            // Yorumcu adı
            const name = document.createElement('div');
            name.className = 'comment-name';
            name.textContent = comment.name || 'Anonim';

            // Yorum metni
            const text = document.createElement('div');
            text.className = 'comment-text';
            text.textContent = comment.text;

            // Yorum tarihi
            const date = document.createElement('div');
            date.className = 'comment-date';
            date.textContent = new Date(comment.createdAt).toLocaleString('tr-TR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            commentDiv.appendChild(name);
            commentDiv.appendChild(text);
            commentDiv.appendChild(date);
            commentsContainer.appendChild(commentDiv);
        });

        // Scroll ayarları
        commentsContainer.className = 'comments-container';

    } catch (error) {
        console.error('Yorumlar yüklenirken hata:', error);

        // Detaylı hata mesajı
        commentsContainer.innerHTML = `
            <div class="error-container">
                <div class="error-title">
                    <i class="fas fa-exclamation-circle"></i> Yorumlar yüklenirken hata oluştu
                </div>
                <div class="error-message">
                    ${error.message}
                </div>
                <button onclick="loadComments()" class="retry-button">
                    <i class="fas fa-sync-alt"></i> Tekrar Dene
                </button>
            </div>
        `;
    }
};

document.addEventListener('DOMContentLoaded', function () {
    // ===== Three.js Model Arkaplan =====
    const container = document.getElementById('modelContainer');
    const loadingOverlay = document.getElementById('loadingOverlay');
    const progressBar = document.getElementById('progressBar');

    const scene3d = new THREE.Scene();
    scene3d.background = new THREE.Color(0x222222);

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 2.5;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene3d.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 1);
    scene3d.add(directionalLight);

    const loader = new THREE.GLTFLoader();
    function frameObject(camera, object, offset = 1.2) {
        const box = new THREE.Box3().setFromObject(object);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        const maxSize = Math.max(size.x, size.y, size.z);
        const fitHeightDistance = maxSize / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5)));
        const fitWidthDistance = fitHeightDistance / camera.aspect;
        const distance = offset * Math.max(fitHeightDistance, fitWidthDistance);

        const yDown = 0 * maxSize;
        camera.position.set(center.x, center.y - yDown, center.z + distance);

        camera.near = distance / 100;
        camera.far = distance * 100;
        camera.updateProjectionMatrix();
        camera.lookAt(center);
    }

    loader.load(
        '/models/guts.glb',
        function (gltf) {
            const model = gltf.scene;
            model.scale.set(0.63, 0.63, 0.63);
            model.position.y = -0.8;
            scene3d.add(model);
            frameObject(camera, model);

            const box = new THREE.Box3().setFromObject(model);
            const center = box.getCenter(new THREE.Vector3());
            controls.target.copy(center);
            controls.update();

            loadingOverlay.style.opacity = '0';
            setTimeout(() => { loadingOverlay.style.display = 'none'; }, 500);
        },
        function (xhr) {
            if (xhr.total) progressBar.value = (xhr.loaded / xhr.total) * 100;
        },
        function (error) {
            console.error('Model yükleme hatası:', error);
            loadingOverlay.innerHTML = `<div style="text-align:center;padding:20px;">
                <h2>Model Yüklenemedi!</h2>
                <p>${error.message || 'Bilinmeyen hata'}</p>
                <button onclick="window.location.reload()" style="padding:10px 20px;background:#fff;color:#000;border:none;cursor:pointer;">Yeniden Dene</button>
            </div>`;
        }
    );

    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = false;

    function animate() {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene3d, camera);
    }
    animate();

    window.addEventListener('resize', function () {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        updatePanelPositions(currentAngle);
        updateLowerPanelPositions(currentLowerAngle);
    });

    // ===== Hex Carousel =====
    const hexSceneUpper = document.getElementById('hexSceneUpper');
    const hexSceneLower = document.getElementById('hexSceneLower');
    const leftArrow = document.getElementById('leftArrow');
    const rightArrow = document.getElementById('rightArrow');
    const upArrow = document.getElementById('upArrow');
    const downArrow = document.getElementById('downArrow');

    // Üst grup panelleri
    const panels = [1, 2, 3, 4, 5, 6];
    const panelElements = [];
    const panelRotations = new Array(panels.length).fill(null);

    // Alt grup panelleri
    const lowerPanels = [7, 8, 9, 10, 11, 12];
    const lowerPanelElements = [];
    const lowerPanelRotations = new Array(lowerPanels.length).fill(null);

    // Üst grup panellerini oluştur
    panels.forEach(id => {
        const el = document.createElement('div');
        el.className = 'hex-panel';
        const inner = document.createElement('div');
        inner.className = 'hex-panel-inner';
        if (id === 1) {
            const wrapper = document.createElement('div');
            wrapper.className = 'about-wrapper';

            const title = document.createElement('h3');
            title.textContent = 'Ben Kimim?';
            title.className = 'about-title';

            const p = document.createElement('p');
            p.textContent = 'Merhaba, bwn N1celerI6mdAĞLAdı41. Uzun zamandır shifting ile berserk evrenine ışınlanmak için çabalar sarf ediyorum. En büyük motivasyonum gutsın karısını bi posta da benim sikmem. Bu sitede de shiftingin incelikleri ve atomik, atom altı düzeyde başka evrenlere ışınlanmanın biyolojik ve fiziksel sonuçları üzerine çalıştığım araştırma ve projelerimi paylaşmayı düşünüyorum.';
            p.className = 'about-text';

            wrapper.appendChild(title);
            wrapper.appendChild(p);
            inner.appendChild(wrapper);
        } else {
            inner.textContent = String(id);
        }
        el.appendChild(inner);
        el.dataset.id = String(id);
        hexSceneUpper.appendChild(el);
        panelElements.push(el);
    });

    // Alt grup panellerini oluştur
    lowerPanels.forEach(id => {
        const el = document.createElement('div');
        el.className = 'hex-panel';
        const inner = document.createElement('div');
        inner.className = 'hex-panel-inner';

        if (id === 7) {
            const wrapper = document.createElement('div');
            wrapper.className = 'comment-form-wrapper';

            const title = document.createElement('h3');
            title.textContent = 'Yorum Yap';
            title.className = 'comment-form-title';

            const form = document.createElement('form');
            form.method = 'post';
            form.action = '/Comment/Add';
            form.className = 'comment-form';

            // Anti-forgery token ekle
            const token = document.createElement('input');
            token.type = 'hidden';
            token.name = '__RequestVerificationToken';
            token.value = document.querySelector('input[name="__RequestVerificationToken"]')?.value || '';
            form.appendChild(token);

            const nameLabel = document.createElement('label');
            nameLabel.textContent = 'İsim (opsiyonel)';
            nameLabel.className = 'form-label';

            const nameInput = document.createElement('input');
            nameInput.type = 'text';
            nameInput.name = 'Name';
            nameInput.maxLength = 100;
            nameInput.className = 'form-input';

            const commentLabel = document.createElement('label');
            commentLabel.textContent = 'Yorumunuz*';
            commentLabel.className = 'form-label';

            const commentInput = document.createElement('textarea');
            commentInput.name = 'Text';
            commentInput.required = true;
            commentInput.maxLength = 500;
            commentInput.className = 'form-textarea';

            const submitBtn = document.createElement('button');
            submitBtn.type = 'submit';
            submitBtn.textContent = 'Gönder';
            submitBtn.className = 'form-submit-btn';

            form.appendChild(nameLabel);
            form.appendChild(nameInput);
            form.appendChild(commentLabel);
            form.appendChild(commentInput);
            form.appendChild(submitBtn);

            wrapper.appendChild(title);
            wrapper.appendChild(form);
            inner.appendChild(wrapper);

            // Form gönderildikten sonra yorumları yenile
            form.onsubmit = async function (e) {
                e.preventDefault();
                try {
                    const submitBtn = form.querySelector('button[type="submit"]');
                    submitBtn.disabled = true;
                    submitBtn.textContent = 'Gönderiliyor...';

                    const formData = new FormData(form);
                    const token = document.querySelector('input[name="__RequestVerificationToken"]').value;

                    const response = await fetch(form.action, {
                        method: 'POST',
                        body: formData,
                        headers: {
                            'RequestVerificationToken': token
                        }
                    });

                    const result = await response.json();

                    if (result.success) {
                        form.reset();
                        await loadComments();
                    } else {
                        alert('Hata: ' + (result.errors?.join(', ') || 'Bilinmeyen hata'));
                    }
                } catch (error) {
                    console.error('Yorum gönderilirken hata:', error);
                    alert('Bir hata oluştu: ' + error.message);
                } finally {
                    const submitBtn = form.querySelector('button[type="submit"]');
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Gönder';
                }
            };
        } else if (id === 8) {
            const wrapper = document.createElement('div');
            wrapper.className = 'comments-list-wrapper';

            const title = document.createElement('h3');
            title.textContent = 'Son Yorumlar';
            title.className = 'comments-list-title';

            const commentsContainer = document.createElement('div');
            commentsContainer.id = 'commentsContainer';
            commentsContainer.className = 'comments-display-container';

            wrapper.appendChild(title);
            wrapper.appendChild(commentsContainer);
            inner.appendChild(wrapper);

            // Sayfa yüklendiğinde yorumları yükle
            loadComments();

            // Her 30 saniyede bir yorumları yenile
            setInterval(loadComments, 30000);
        } else {
            inner.textContent = String(id);
        }
        el.appendChild(inner);
        el.dataset.id = String(id);
        hexSceneLower.appendChild(el);
        lowerPanelElements.push(el);
    });

    let currentAngle = 0;
    let currentLowerAngle = 0;
    const angleStep = 60;

    // Scroll pozisyonu takibi
    let currentScrollPosition = 0; // 0: üst grup, 1: alt grup
    let isAnimating = false;

    function rotate(angle) {
        if (currentScrollPosition === 0) {
            currentAngle += angle;
            updatePanelPositions(currentAngle);
        } else {
            currentLowerAngle += angle;
            updateLowerPanelPositions(currentLowerAngle);
        }
    }

    function scrollTo(positionIndex) {
        if (isAnimating || positionIndex < 0 || positionIndex > 1) return;

        isAnimating = true;
        currentScrollPosition = positionIndex;

        if (positionIndex === 0) {
            // Yukarı scroll - üst grubu geri getir
            hexSceneUpper.style.transform = 'translateY(0)';
            hexSceneLower.style.transform = 'translateY(100%)';
        } else {
            // Aşağı scroll - üst grubu yukarı çıkar, alt grubu getir
            hexSceneUpper.style.transform = 'translateY(-100%)';
            hexSceneLower.style.transform = 'translateY(0)';
        }

        // Okları güncelle
        upArrow.style.display = positionIndex === 0 ? 'none' : 'flex';
        downArrow.style.display = positionIndex === 1 ? 'none' : 'flex';

        // Animasyon bitince kilidi kaldır
        setTimeout(() => {
            isAnimating = false;
        }, 800); // CSS'deki transition süresiyle aynı olmalı
    }

    function normalizeAngleDeg(deg) {
        let a = ((deg + 180) % 360 + 360) % 360 - 180;
        return a;
    }
    // Panel konumlandırma fonksiyonlarını güncelle
    function updatePanelPositions(angle) {
        const radius = 600;
        const sceneHeight = hexSceneUpper.clientHeight;
        const panelHalfHeight = 140; // Panel yüksekliğinin yarısı (280/2)
        const baseBottomMargin = 80; // Alt kenar boşluğu artırıldı
        const uplift = 200; // Panelleri daha alta çekmek için azaltıldı (260'dan 50'ye)
        const yFrontBase = (sceneHeight / 2) - panelHalfHeight - baseBottomMargin - uplift;
        const stepY = 120;

        panelElements.forEach((panel, index) => {
            const rawAngle = angle + index * 60;
            const panelAngleNorm = normalizeAngleDeg(rawAngle);
            const rad = (rawAngle % 360) * Math.PI / 180;

            const x = Math.sin(rad) * radius;
            const z = Math.cos(rad) * radius;

            const absA = Math.abs(panelAngleNorm);
            let layer = (absA < 30) ? 0 : (absA < 90) ? 1 : (absA < 150) ? 2 : 3;

            const opacity = (layer === 3) ? 0 : Math.max(0, 1 - 0.2 * layer);
            const scale = 1 - 0.1 * layer;
            const y = yFrontBase - (stepY * layer);

            const prev = panelRotations[index];
            let target = panelAngleNorm;
            if (prev !== null) {
                while (target - prev > 180) target -= 360;
                while (target - prev < -180) target += 360;
            }
            panelRotations[index] = target;

            panel.style.transform = `translate3d(${x}px, ${y}px, ${z}px) rotateY(${target}deg) scale(${scale})`;
            panel.style.opacity = opacity;

            const inner = panel.querySelector('.hex-panel-inner');
            if (inner) inner.style.transform = (layer === 3) ? 'rotateY(180deg)' : 'rotateY(0deg)';
            panel.style.zIndex = String(Math.round(1000 + z));
        });
    }

    function updateLowerPanelPositions(angle) {
        const radius = 600;
        const sceneHeight = hexSceneLower.clientHeight;
        const panelHalfHeight = 140; // Panel yüksekliğinin yarısı (280/2)
        const baseBottomMargin = 80; // Alt kenar boşluğu artırıldı
        const uplift = 200; // Panelleri daha alta çekmek için azaltıldı (260'dan 50'ye)
        const yFrontBase = (sceneHeight / 2) - panelHalfHeight - baseBottomMargin - uplift;
        const stepY = 120;

        lowerPanelElements.forEach((panel, index) => {
            const rawAngle = angle + index * 60;
            const panelAngleNorm = normalizeAngleDeg(rawAngle);
            const rad = (rawAngle % 360) * Math.PI / 180;

            const x = Math.sin(rad) * radius;
            const z = Math.cos(rad) * radius;

            const absA = Math.abs(panelAngleNorm);
            let layer = (absA < 30) ? 0 : (absA < 90) ? 1 : (absA < 150) ? 2 : 3;

            const opacity = (layer === 3) ? 0 : Math.max(0, 1 - 0.2 * layer);
            const scale = 1 - 0.1 * layer;
            const y = yFrontBase - (stepY * layer);

            const prev = lowerPanelRotations[index];
            let target = panelAngleNorm;
            if (prev !== null) {
                while (target - prev > 180) target -= 360;
                while (target - prev < -180) target += 360;
            }
            lowerPanelRotations[index] = target;

            panel.style.transform = `translate3d(${x}px, ${y}px, ${z}px) rotateY(${target}deg) scale(${scale})`;
            panel.style.opacity = opacity;

            const inner = panel.querySelector('.hex-panel-inner');
            if (inner) inner.style.transform = (layer === 3) ? 'rotateY(180deg)' : 'rotateY(0deg)';
            panel.style.zIndex = String(Math.round(1000 + z));
        });
    }

    // İlk yerleşim
    updatePanelPositions(0);
    updateLowerPanelPositions(0);
    scrollTo(0); // Başlangıçta üst grup gösterilsin
    upArrow.style.display = 'none'; // Başlangıçta yukarı ok gizli

    // Oklara tıklama
    leftArrow.addEventListener('click', () => rotate(angleStep));
    rightArrow.addEventListener('click', () => rotate(-angleStep));
    upArrow.addEventListener('click', () => scrollTo(0));
    downArrow.addEventListener('click', () => scrollTo(1));

    // Klavye kontrolleri
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') rotate(angleStep);
        if (e.key === 'ArrowRight') rotate(-angleStep);
        if (e.key === 'ArrowUp') scrollTo(0);
        if (e.key === 'ArrowDown') scrollTo(1);
    });

    // Fare tekerleği ile scroll
    document.addEventListener('wheel', (e) => {
        e.preventDefault();
        if (e.deltaY > 0 && currentScrollPosition === 0) {
            scrollTo(1);
        } else if (e.deltaY < 0 && currentScrollPosition === 1) {
            scrollTo(0);
        }
    }, { passive: false });

    // ViewData'dan showComments değerini al - bu kısmı HTML'de tanımlamanız gerekecek
    const showComments = window.showComments || false;

    // Sayfa yüklendiğinde kontrol et ve yorum panelini aç
    if (showComments) {
        scrollTo(1); // Alt gruba geçiş yap
        currentLowerAngle = 0; // Yorum panelini (7. panel) merkeze al
        updateLowerPanelPositions(currentLowerAngle);
    }

    if (document.getElementById('commentsContainer')) {
        loadComments();
    }
});