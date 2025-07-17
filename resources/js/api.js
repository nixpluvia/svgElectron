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
    _private.optimizedIcons = [];
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
async function modalSelectAddIcons(type){
    try {
        if (type === 'folder') {
            const api = await selectAddFolder();
            if (api === false) return;
        } else if (type === 'svg') {
            const api = await selectAddSvg();
            if (api === false) return;
        } else if (type === 'code') {
            const api = selectAddCode();
            if (api === false) return;
        }
    } catch (error) {
        console.error(error);
        return;
    }
    // svg 최적화
    optimizeSVG();
    modal.close('#svgAddModal');
    ueye.toast.action({
        status: 'success',
        message: '아이콘이 추가되었습니다.',
        type : 'mini'
    });
}
// SVG Code 추가 메서드
function selectAddCode(){
    let svgNameEl = document.querySelector('#svgAddName');
    let svgCodeEl = document.querySelector('#svgAddCode');
    let svgName = svgNameEl.value;
    let svgCode = svgCodeEl.value;
    svgCode = svgCode.trim();
    if (svgCode === '') {
        alert('SVG 코드를 입력해주세요.');
        return false;
    }

    // SVG 형식 확인
    let parser = new DOMParser();
    let doc = parser.parseFromString(svgCode, "image/svg+xml");
    let isSvg = doc.documentElement && doc.documentElement.nodeName.toLowerCase() === 'svg';
    let parseError = doc.querySelector('parsererror');
    if (!isSvg || parseError) {
        alert('유효한 SVG 코드가 아닙니다.');
        return false;
    }

    let svgData = {
        name: svgName || 'new-icon',
        data: svgCode,
        sizes: "32x32", // 기본값, 필요시 수정 가능
        category: [],
        updated: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };
    const iconCards = document.getElementById('iconCards');

    // 아이콘 카드 렌더링
    iconCards.appendChild(renderCard(svgData));
    // _repository에 데이터 채우기
    _repository.icons.push(svgData);

    // 폼 필드 초기화
    svgNameEl.value = '';
    svgCodeEl.value = '';
}
// 폴더 선택 메서드
async function selectAddFolder() {
    const folderData = await window.electronAPI.selectFolder();
    if (folderData === null || folderData === undefined) {
        ueye.toast.action({
            status: 'warning',
            message: '취소되었습니다.',
            type : 'mini'
        });
        return false;
    };
    const iconCards = document.getElementById('iconCards');

    // 아이콘 카드 렌더링
    iconCards.appendChild(renderCard(folderData.data));

    // _repository에 데이터 채우기
    _repository.icons.push(...folderData.data);
}
// SVG 파일 선택 메서드
async function selectAddSvg() {
    const fileData = await window.electronAPI.selectSvg();
    if (fileData === null || fileData === undefined) {
        ueye.toast.action({
            status: 'warning',
            message: '취소되었습니다.',
            type : 'mini'
        });
        return false;
    };
    const iconCards = document.getElementById('iconCards');

    // 아이콘 카드 렌더링
    iconCards.appendChild(renderCard(fileData.data));
    // _repository에 데이터 채우기
    _repository.icons.push({...fileData.data});
}
// JSON 파일 선택 메서드
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
    _repository.icons = svgInfo.icons || null;

    // 폼 필드에 데이터 채우기
    document.getElementById('projectTitle').value = svgInfo.title || 'SVG Project';
    document.getElementById('projectDescription').value = svgInfo.description || 'A project using SVG icons';
    document.getElementById('projectVersion').value = svgInfo.version || '1.0.0';
    document.getElementById('fontPrefix').value = svgInfo.fontPrefix || '';

    // colorSet이 있다면 색상 폼에 추가
    const colorForms = document.querySelector('#colorForms');
    colorForms.innerHTML = ''; // 기존 폼 초기화
    if (svgInfo.colorSet && svgInfo.colorSet.length > 0) {
        svgInfo.colorSet.forEach(d => {
            const colorHex = d.color || '#000000';
            const html = `
                <div class="f-color">
                    <span style="background-color: ${colorHex};"></span>
                    <input type="text" name="colorSet" class="f-control" data-size="xs" data-color="${colorHex}" value="${d.suffix || ''}" placeholder="접미사(suffix)">
                    <button type="button" class="btn" data-size="xs" data-level="1" data-s="outline" onclick="layout_main.deleteColor(this)"><i class="i-close"></i></button>
                </div>
            `;
            colorForms.insertAdjacentHTML('beforeend', html);
        });
    }
}

/**
 * 아이콘 카드 렌더링 함수
 * @param {Array} data 
 * @returns 
 */
function renderCard(data) {
    const fragment = document.createDocumentFragment();
    if (data === null || data === undefined) return fragment;
    if (!Array.isArray(data)) {
        createCard(data);
    } else {
        data.forEach(createCard);
    }

    function createCard (icon) {
        const col = document.createElement('div');
        col.className = 'item';
        col.innerHTML = `
            <div class="icon-card" data-icon-name="${icon.name}">
                <div class="ck">
                    <label class="f-check only">
                        <input type="checkbox" name="iconSelect" value="${icon.name}" aria-label="...">
                        <span></span>
                    </label>
                </div>
                <div class="content">
                    ${icon.data}
                    <button type="button" class="btn-copy" onclick="edit_main.showEditModal('${icon.name}')"><span class="blind">COPY</span></button>
                </div>
                <button type="button" class="btn-title" onclick="copyCode('data', '${icon.name}')"><strong class="tit-xs">${icon.name || '이름없음'}</strong></button>
                <button type="button" class="btn-del" onclick="card_main.deleteIcon(this, '${icon.name}')"><i class="i-delete"></i><span class="blind">삭제</span></button>
            </div>
        `
        fragment.appendChild(col);
    }
    return fragment;
}

/**
 * SVG 최적화 함수
 */
function optimizeSVG() {
    _repository.icons.forEach(icon => {
        if (_private.optimizedIcons.includes(icon.name)) return;
        const svg = document.querySelector('#iconArea .icon-card[data-icon-name="' + icon.name + '"] svg');
        const optimizedSVG = optimize(svg);
        icon.data = optimizedSVG;
        _private.optimizedIcons.push(icon.name);
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
 */
function sendSvgData() {
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

    const projectTitle = document.getElementById('projectTitle').value || 'SVG Project';
    const projectDescription = document.getElementById('projectDescription').value || 'A project using SVG icons';
    const projectVersion = document.getElementById('projectVersion').value || '1.0.0';
    const fontPrefix = document.getElementById('fontPrefix').value || '';
    document.querySelectorAll('input[name="colorSet"]').forEach(el => {
        const suffix = el.value.trim();
        const color = el.dataset.color || '#000000';
        if (suffix !== '') {
            _repository.colorSet.push({ suffix, color });
        }
    });

    ueye.loading.show();
    const data = {
        projectInfo : {
            title : projectTitle,
            description : projectDescription,
            version : projectVersion,
            fontPrefix : fontPrefix,
            colorSet : _repository.colorSet || []
        },
        icons : icons
    }
    return data;
}

function requestGenerate(type){
    const data = sendSvgData();
    if (data === false || type === undefined) return;
    
    if (type === 'all') {
        if (confirm('SVG가 Path로 구성되지 않은 경우에 정상적으로 생성되지 않을 수 있습니다.\n\n계속하시겠습니까?')) {
            window.electronAPI.generateAll(data);
        }
    } else if (type === 'variable') {
        window.electronAPI.generateVariable(data);
    } else if (type === 'font') {
        if (confirm('SVG가 Path로 구성되지 않은 경우에 정상적으로 생성되지 않을 수 있습니다.\n\n계속하시겠습니까?')) {
            window.electronAPI.generateFont(data);
        }
    } else if (type === 'sprite') {
        if (_repository.colorSet.length > 0) {
            if (confirm('Color Set을 사용할 경우 Path로 구성된 SVG만 색상 변경 생성이 가능합니다.\n\n계속하시겠습니까?')) {
                window.electronAPI.generateSprite(data);
            }
        } else {
            window.electronAPI.generateSprite(data);
        }
    }
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
/**
 * variable css 생성을 완료했을 때 호출되는 함수
 */
window.electronAPI.onGenerateVariableDone((event, arg) => {
    if (typeof arg === 'string' && arg !== 'success') {
        ueye.loading.hide();
        ueye.toast.action({
            status: 'warning',
            message: arg,
            type : 'mini'
        });
        return;
    }
    ueye.loading.hide();
});
/**
 * sprite css 생성을 완료했을 때 호출되는 함수
 */
window.electronAPI.onGenerateSpriteDone((event, arg) => {
    if (typeof arg === 'string' && arg !== 'success') {
        ueye.loading.hide();
        ueye.toast.action({
            status: 'warning',
            message: arg,
            type : 'mini'
        });
        return;
    }
    ueye.loading.hide();
});
/**
 * sprite css 생성을 완료했을 때 호출되는 함수
 */
window.electronAPI.onGenerateAllDone((event, arg) => {
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