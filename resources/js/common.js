
const modal = ueye.modal();
const dropbox = ueye.dropbox({
    animation : true,
});

const _repository = {
    title: 'svg-electron',
    version: '1.0.0',
    description: 'SVG Font Generator using Electron',
    fontName: 'MyCustomFont',
    icons : null,
}

document.addEventListener('DOMContentLoaded', () => {
    document.querySelector('#toggleInfo').addEventListener('click', function() {
        if (this.classList.contains('active')) {
            this.classList.remove('active');
            document.body.setAttribute('data-fold-info', 'N');
        } else {
            this.classList.add('active');
            document.body.setAttribute('data-fold-info', 'Y');
        }
    });
})

// 사용 가이드
let isRenderedGuide = false;
async function showGuideModal() {
    if (!isRenderedGuide) {
        try {
            const guide = await window.electronAPI.loadMarkdown('resources/data/guide.md');
            document.getElementById('guideContent').innerHTML = guide;
            isRenderedGuide = true;
        } catch (error) {
            console.error('Error loading guide:', error);
        }
    }
    modal.open('#guideModal');
}

// 모달 창 열기 메서드
function showEditModal(iconName) {
    const icon = _repository.icons.find(icon => icon.name === iconName);
    if (icon === undefined) return;
    const preview = document.getElementById('iconPreview');
    const iconNameTxt = document.getElementById('editIconName');
    const iconCodeTxt = document.getElementById('editIconCode');

    // 데이터 채우기
    console.log(icon)
    preview.innerHTML = icon.data;
    iconNameTxt.innerHTML = icon.name;
    iconCodeTxt.innerHTML = icon.code;

    // 모달 열기
    modal.open('#editModal');
}

// 클립보드 코드 복사 메서드
function copyCode(iconName) {
    const icon = _repository.icons.find(icon => icon.name === iconName);
    if (icon) {
        const svgContent = icon.data;
        core.copyToClipboard(svgContent)
    }
}

// 아이콘 삭제 메서드
function deleteIcon(el, iconName) {
    const icon = _repository.icons.find(icon => icon.name === iconName);
    if (icon) {
        _repository.icons = _repository.icons.filter(icon => icon.name !== iconName);
        el.closest('.icon-card').remove();

        ueye.toast.action({
            status: 'success',
            message: '아이콘이 삭제되었습니다.',
            type : 'mini'
        });
    }
}


function parseVersion(ver) {
    let parts = ver.split('.').map(Number);
    while (parts.length < 3) parts.push(0);
    return parts;
}
function formatVersion(parts) {
    return parts.join('.');
}
function changeVersion(delta) {
    const input = document.getElementById('projectVersion');
    let [major, minor, patch] = parseVersion(input.value || "1.0.0");
    patch += delta;

    // 패치가 10 이상이면 마이너 증가, 패치 0으로
    while (patch >= 10) {
        patch -= 10;
        minor += 1;
    }

    // 패치가 0 미만이면 마이너 감소, 패치 9로
    while (patch < 0 && minor > 0) {
        patch += 10;
        minor -= 1;
    }

    // 마이너가 10 이상이면 메이저 증가, 마이너 0으로
    while (minor >= 10) {
        minor -= 10;
        major += 1;
    }

    // 마이너가 0 미만이면 메이저 감소, 마이너 9로
    while (minor < 0 && major > 0) {
        minor += 10;
        major -= 1;
    }

    input.value = formatVersion([major, minor, patch]);
}

/*-------------------------------------------------------------------
    @Electron API
    @description Electron API를 통해 폴더 선택 및 아이콘 데이터 가져오기
-------------------------------------------------------------------*/
async function selectFolder() {
    const folderData = await window.electronAPI.selectFolder();
    if (folderData === null || folderData === undefined) {
        ueye.toast.action({
            status: 'warning',
            message: '취소되었습니다.',
            type : 'mini'
        });
        return;
    };
    const iconCards = document.getElementById('iconCards');

    // 아이콘 카드 렌더링
    iconCards.innerHTML = '';
    iconCards.appendChild(renderCard(folderData.data));

    // _repository에 데이터 채우기
    _repository.path = folderData.path;
    _repository.icons = folderData.data;

    // svg 최적화
    optimizeSVG();
}

async function selectJson() {
    const folderData = await window.electronAPI.selectJson();
    if (folderData === null || folderData === undefined) {
        ueye.toast.action({
            status: 'warning',
            message: '취소되었습니다.',
            type : 'mini'
        });
        return;
    };
    const svgInfo = folderData.data;

    // 아이콘 카드 렌더링
    const iconCards = document.getElementById('iconCards');
    iconCards.innerHTML = '';
    iconCards.appendChild(renderCard(svgInfo.icons));

    // _repository에 데이터 채우기
    _repository.path = folderData.path;
    _repository.title = svgInfo.title || 'svg-electron';
    _repository.version = svgInfo.version || '1.0.0';
    _repository.description = svgInfo.description || 'SVG Font Generator using Electron';
    _repository.fontName = svgInfo.fontName || 'MyCustomFont';
    _repository.icons = svgInfo.icons || null;

    // 폼 필드에 데이터 채우기
    document.getElementById('projectTitle').value = svgInfo.title || 'SVG Project';
    document.getElementById('projectDescription').value = svgInfo.description || 'A project using SVG icons';
    document.getElementById('projectVersion').value = svgInfo.version || '1.0.0';
    document.getElementById('fontName').value = svgInfo.fontName || 'MyCustomFont';
}

/**
 * 아이콘 카드 렌더링 함수
 * @param {Array} data 
 * @returns 
 */
function renderCard(data) {
    const fragment = document.createDocumentFragment();
    data.forEach(icon => {
        const col = document.createElement('div');
        col.className = 'item';
        col.innerHTML = `
            <div class="icon-card" data-icon-name="${icon.name}">
                <div class="ck">
                    <label class="f-check only">
                        <input type="checkbox" name="iconSelect" value="${icon.name}" checked aria-label="...">
                        <span></span>
                    </label>
                </div>
                <div class="content">
                    ${icon.data}
                    <button type="button" class="btn-copy" onclick="copyCode('${icon.name}')"><span class="blind">COPY</span></button>
                </div>
                <div class="info">
                    <div class="hd"><strong class="tit-sm">${icon.name || '이름없음'}</strong></div>
                    <button type="button" class="btn" data-level="2" data-size="xs" onclick="showEditModal('${icon.name}')">+</button>
                </div>
                <button type="button" class="btn-del" onclick="deleteIcon(this, '${icon.name}')"><span class="blind">삭제</span></button>
            </div>
        `
        fragment.appendChild(col);
    });
    return fragment;
}

/**
 * SVG 최적화 함수
 */
function optimizeSVG() {
    document.querySelectorAll('#iconArea svg').forEach(svg => {
        const optimizedSVG = optimize(svg);
        const iconName = svg.closest('.icon-card').getAttribute('data-icon-name');
        _repository.icons.find(icon => icon.name === iconName).data = optimizedSVG;
    });
}
function optimize(svg){
    const draw = SVG(svg);
    let includeStroke = false;
    let msg = '';
    // svg 크기 속성 제거
    draw.attr('width', null);
    draw.attr('height', null);
    // 불필요한 요소(defs, style, g 등) 제거
    draw.find('defs, style').forEach(el => {
        el.remove();
    });
    // g 요소 내부의 자식들을 svg 바로 아래로 이동시키고 g는 제거
    draw.find('g').forEach(g => {
        // g의 자식 노드들을 svg 바로 아래로 이동
        while (g.node.firstChild) {
            draw.node.appendChild(g.node.firstChild);
        }
        g.remove();
    });

    // 각 도형 요소에 대해 처리
    // fill, stroke 속성을 제거하고, path로 변환
    draw.each(function () {
        // DOM 노드에서 계산된 스타일 가져오기
        const computed = window.getComputedStyle(this.node);
        const fillValue = computed.fill;
        const strokeValue = computed.stroke;
        let isStrokeOnly = false;

        // fill 값이 none 이고, stroke가 존재하면 stroke 기반으로 간주
        if ((fillValue === 'none' || !fillValue) && strokeValue !== 'none') {
            isStrokeOnly = true;
            includeStroke = true;
        }

        // ✅ 경고
        if (isStrokeOnly) {
            // this.stroke({ color: 'currentColor'});
            msg = `⚠️ ${this.type} 요소는 stroke 기반이며, fill로 변환할 수 없습니다.`;
        } else {
            let target = this;
            // path 변환 작업
            if (this.type !== 'path') {
                try {
                    const pathData = this.toPath();
                    if (pathData) {
                        target = pathData;
                        this.remove();
                    }
                } catch (e) {
                    // 변환 실패 시 무시
                }
            }

            // 스타일 속성 제거
            target.attr('style', null);
            // fill, stroke 속성 제거
            target.attr('fill', null);
            target.attr('stroke', null);
            target.attr('stroke-width', null);
            target.attr('stroke-linecap', null);
            target.attr('stroke-linejoin', null);
            target.attr('stroke-dasharray', null);
            target.attr('stroke-dashoffset', null);
            target.attr('fill-opacity', null);
            target.attr('opacity', null);
        }
    });
    draw.attr('fill', 'currentColor');
    if (includeStroke) {
        const error = document.createElement('span');
        error.className = 'err'
        // error.textContent = msg;
        svg.closest('.icon-card').querySelector('.ck').appendChild(error);
    }
    // SVG 태그 문자열 추출 및 콘솔 출력
    let svgTag = svg.outerHTML;
    svgTag = svgTag.replace(/<!--[\s\S]*?-->/g, '');
    svgTag = svgTag.replace(/>\s+</g, '><');

    return svgTag;
}


/**
 * 선택된 SVG 데이터를 전송하는 함수
 * @param {*} svgContent 
 * @param {*} iconName 
 */
function sendSvgData(svgContent, iconName) {
    const projectTitle = document.getElementById('projectTitle').value || 'SVG Project';
    const projectDescription = document.getElementById('projectDescription').value || 'A project using SVG icons';
    const projectVersion = document.getElementById('projectVersion').value || '1.0.0';
    const fontName = document.getElementById('fontName').value || 'MyCustomFont';
    const icons = [];

    document.querySelectorAll('input[name="iconSelect"]:checked').forEach(checkbox => {
        const iconName = checkbox.value;
        const iconData = _repository.icons.find(icon => icon.name === iconName);
        if (iconData) {
            icons.push(iconData);
        }
    });
    if (icons.length === 0) {
        ueye.toast.action({
            status: 'warning',
            message: '선택된 아이콘이 없습니다.',
            type : 'mini'
        });
        console.warn('No icons selected for font generation.');
        return false;
    }

    ueye.loading.show();
    const data = {
        projectInfo : {
            title : projectTitle,
            description : projectDescription,
            version : projectVersion,
            fontName : fontName,
        },
        icons : icons
    }
    window.electronAPI.generateFont(data);
}




/**
 * SVG 폰트 생성을 완료했을 때 호출되는 함수
 */
window.electronAPI.onGenerateFontDone((event, arg) => {
    if (typeof arg === 'string') {
        ueye.loading.hide();
        ueye.toast.action({
            status: 'warning',
            message: arg,
            type : 'mini'
        });
        return;
    }
    const iconCards = document.getElementById('iconCards');
    const svgInfo = arg.data;
    iconCards.innerHTML = '';
    iconCards.appendChild(renderCard(svgInfo.icons));
    ueye.loading.hide();
});