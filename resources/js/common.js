
const modal = ueye.modal();
const dropbox = ueye.dropbox({
    animation : true,
});

const _private = {
    editIcon : {
        name: null,
        idx : null,
    },
    isShiftPressed: false,
    prevChecked : null,
    optimizedIcons: [],
}
const _repository = {
    title: 'sim',
    version: '1.0.0',
    description: 'SVG Font Generator using Electron',
    fontPrefix : null,
    colorSet : [],
    icons : [],
}



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

// 클립보드 코드 복사 메서드
function copyCode(type, iconName) {
    let targetElement;
    if (type === 'tag') {
        targetElement = document.getElementById('modalIconTag');
    } else if (type === 'css') {
        targetElement = document.getElementById('modalIconCss');
    } else if (type === 'variable') {
        targetElement = document.getElementById('modalIconVariable');
    } else if (type === 'code') {
        targetElement = document.getElementById('modalIconCode');
    } else if (type === 'data') {
        if (iconName) {
            let fontPrefix = _repository.fontPrefix || document.getElementById('fontPrefix').value || '';
            fontPrefix = fontPrefix == "" || fontPrefix == null ? '' : fontPrefix + '-';
            const tag = `<i class="i-${fontPrefix}${iconName}" aria-hidden="true"></i>`;
            core.copyToClipboard(tag)
        }
    }

    if (targetElement) {
        const content = targetElement.innerText;
        core.copyToClipboard(content);
    }
}



const layout_main = {
    init (){
        // 메뉴 토글
        document.querySelector('#toggleInfo').addEventListener('click', function() {
            if (this.classList.contains('active')) {
                this.classList.remove('active');
                document.body.setAttribute('data-fold-info', 'N');
            } else {
                this.classList.add('active');
                document.body.setAttribute('data-fold-info', 'Y');
            }
        });

        /**
         * 단축키
         */
        document.addEventListener('keydown', function (e) {
            if (!(e.ctrlKey)) return;
            const key = e.key.toLowerCase();
            if (["control"].includes(key)) return;

            if (key == "f") {
                document.getElementById('searchIconInput').focus();
            }
        });
    },
    // 선택된 색상 삭제
    deleteColor(el) {
        const colorDiv = el.closest('.f-color');
        if (colorDiv) {
            colorDiv.remove();
        }
    }
}

const form_main = {
    init (){
        let ins = this;

        // 아이콘 검색
        let searchTimeout;
        document.querySelector('#searchIconInput').addEventListener('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                const searchTerm = this.value.toLowerCase();
                ins.searchIcons(searchTerm);
            }, 300);
        });
        document.querySelector('#btnSearchIcon').addEventListener('click', function() {
            const searchTerm = document.querySelector('#searchIconInput').value.toLowerCase();
            ins.searchIcons(searchTerm);
        });

        // 색상 셋
        const pickr = new Pickr({
            el: '.pickr-container',
            theme: 'monolith', // or 'classic'
            default: '#000000',
            position : 'right-start',
            lockOpacity: true,
            swatches: [
                'rgba(244, 67, 54)',
                'rgba(233, 30, 99)',
                'rgba(156, 39, 176)',
                'rgba(103, 58, 183)',
                'rgba(63, 81, 181)',
                'rgba(33, 150, 243)',
                'rgba(3, 169, 244)'
            ],
            defaultRepresentation: 'HEXA',
            components: {
                preview: true,
                opacity: false,
                hue: true,
                interaction: {
                    hex: false,
                    rgba: false,
                    hsva: false,
                    input: true,
                    clear: true,
                    save: true
                }
            }
        });
        // 색상 선택 후 폼에 추가
        const colorForms = document.querySelector('#colorForms');
        pickr.on('save', (color, instance) => {
            const colorHex = color.toHEXA().toString();
            const html = `
                <div class="f-color">
                    <span style="background-color: ${colorHex};"></span>
                    <input type="text" name="colorSet" class="f-control" data-size="xs" data-color="${colorHex}" placeholder="접미사(suffix)">
                    <button type="button" class="btn" data-size="xs" data-level="1" data-s="outline" onclick="deleteColor(this)"><i class="i-close"></i></button>
                </div>
            `;
            colorForms.insertAdjacentHTML('beforeend', html);
            pickr.hide();
        });
        new Sortable(colorForms, {
            animation: 150,
        });
    },
    searchIcons(searchTerm){
        if (_repository.icons.length === 0) return;
        if (searchTerm === '') {
            // 검색어가 비어있을 때 모든 아이콘 표시
            document.querySelectorAll('#iconCards .item').forEach(item => {
                item.classList.remove('hidden');
            });
        } else {
            const filteredIcons = _repository.icons.reduce((acc, icon) => {
                if (icon.name.toLowerCase().includes(searchTerm)) {
                    acc.push(icon.name.toLowerCase());
                }
                return acc;
            }, []);
            document.querySelectorAll('#iconCards .item').forEach(item => {
                const iconName = item.querySelector('.icon-card').getAttribute('data-icon-name');
                if (filteredIcons.includes(iconName.toLowerCase())) {
                    item.classList.remove('hidden');
                    return;
                }
                item.classList.add('hidden');
            });
        }
    },
    changeVersion(delta) {
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
    },
    parseVersion(ver) {
        let parts = ver.split('.').map(Number);
        while (parts.length < 3) parts.push(0);
        return parts;
    }, 
    formatVersion(parts) {
        return parts.join('.');
    }
}

const card_main = {
    init (){
        let iconCards = document.getElementById('iconCards');
        new Sortable(iconCards, {
            animation: 150,
            onEnd : function (evt) {
                // 아이콘 순서 변경 시 _repository에 반영
                const iconName = evt.item.children[0].getAttribute('data-icon-name');
                const iconIndex = _repository.icons.findIndex(icon => icon.name === iconName);
                if (iconIndex !== -1) {
                    // 아이콘의 순서를 변경
                    const movedIcon = _repository.icons.splice(iconIndex, 1)[0];
                    _repository.icons.splice(evt.newIndex, 0, movedIcon);
                }
            }
        });

        // 아이콘 선택 이벤트
        document.addEventListener('change', function(event) {
            if (event.target.name !== 'iconSelect') return;
            let target = event.target;
            if (_private.isShiftPressed) {
                let startIdx = -1, endIdx = -1;
                for (let idx = 0; idx < _repository.icons.length; idx++) {
                    const d = _repository.icons[idx];
                    if (d.name == _private.prevChecked) {
                        startIdx = idx;
                        if (endIdx > -1) break;
                    }
                    if (d.name == target.value) {
                        endIdx = idx;
                        if (startIdx > -1) break;
                    }
                }
                if (startIdx > -1 && endIdx > -1) {
                    // 순서 보정 (앞뒤 상관없이)
                    const [from, to] = startIdx < endIdx ? [startIdx, endIdx] : [endIdx, startIdx];
                    for (let i = from; i <= to; i++) {
                        const d = _repository.icons[i];
                        document.querySelector(`.icon-card[data-icon-name="${d.name}"] input[name="iconSelect"]`).checked = target.checked;
                    }
                }
            }
            _private.prevChecked = target.value;
        });
        // Shift 키 이벤트
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Shift') {
                _private.isShiftPressed = true;
            }
        });
        document.addEventListener('keyup', (e) => {
            if (e.key === 'Shift') {
                _private.isShiftPressed = false;
            }
        });
    },
    // 아이콘 전체 선택/해제 메서드
    selectAllIcons() {
        const checkboxes = document.querySelectorAll('input[name="iconSelect"]');
        const allChecked = Array.from(checkboxes).every(cb => cb.checked);
        checkboxes.forEach(cb => cb.checked = !allChecked);
    },
    // 아이콘 삭제 메서드
    deleteIcon(el, iconName) {
        if (!confirm('아이콘을 삭제하시겠습니까?')) return;

        const icon = _repository.icons.find(icon => icon.name === iconName);
        if (icon) {
            _repository.icons = _repository.icons.filter(icon => icon.name !== iconName);
            el.closest('.item').remove();

            ueye.toast.action({
                status: 'success',
                message: '아이콘이 삭제되었습니다.',
                type : 'mini'
            });
        }
    },
    // 아이콘 선택 삭제 메서드
    deleteSelectedIcons() {
        const selectedIcons = document.querySelectorAll('input[name="iconSelect"]:checked');
        if (selectedIcons.length === 0) {
            ueye.toast.action({
                status: 'warning',
                message: '삭제할 아이콘을 선택해주세요.',
                type : 'mini'
            });
            return;
        }
        if (!confirm('선택한 아이콘을 삭제하시겠습니까?')) return;

        // 선택된 아이콘 삭제
        const iconNamesToDelete = Array.from(selectedIcons).map(cb => cb.value);
        _repository.icons = _repository.icons.filter(icon => !iconNamesToDelete.includes(icon.name));
        iconNamesToDelete.forEach(iconName => {
            const item = document.querySelector(`.icon-card[data-icon-name="${iconName}"]`).closest('.item');
            if (item) {
                item.remove();
            }
        });
        ueye.toast.action({
            status: 'success',
            message: `선택된 아이콘이 삭제되었습니다.`,
            type : 'mini'
        });
    }
};

const edit_main = {
    init (){
        // 아이콘 편집 모달 - 이름 수정
        document.querySelector('#btnEditIconName').addEventListener('click', function() {
            const titBox = this.closest('.tit-box');
            const iconName = titBox.querySelector('#modalIconName');
            const iconNameInput = titBox.querySelector('#editIconName');
            if (titBox.classList.contains('active')) {
                titBox.classList.remove('active');
                iconName.innerHTML = iconNameInput.value;
            } else {
                titBox.classList.add('active');
                iconNameInput.focus();
            }
        });
        modal.setCallback('#editModal', 'close', () => {
            const titBox = document.querySelector('#editModal .tit-box');
            titBox.classList.remove('active');
        });

        // 아이콘 편집 모달 - 저장
        document.querySelector('#editModalSave').addEventListener('click', function() {
            const data = _repository.icons[_private.editIcon.idx];
            const iconNameInput = document.getElementById('editIconName');
            const iconCardItem = document.querySelector('#iconCards .icon-card[data-icon-name="' + data.name + '"]');
            iconCardItem.setAttribute('data-icon-name', iconNameInput.value);
            iconCardItem.querySelector('.tit-sm').innerHTML = iconNameInput.value;
            data.name = iconNameInput.value;

            // 모달 닫기
            modal.close('#editModal');
        });
    },
    // 모달 창 열기 메서드
    showEditModal(iconName) {
        let iconIdx = null;
        const icon = _repository.icons.find((icon, idx) => {
            if (icon.name === iconName) {
                iconIdx = idx;
                return true;
            }
        });
        if (icon === undefined) return;
        const preview = document.getElementById('iconPreview');
        const iconNameTxt = document.getElementById('modalIconName');
        const iconNameInput = document.getElementById('editIconName');
        const iconTag = document.getElementById('modalIconTag');
        const iconCss = document.getElementById('modalIconCss');
        const iconVariable = document.getElementById('modalIconVariable');
        const iconCode = document.getElementById('modalIconCode');

        let fontPrefix = _repository.fontPrefix || document.getElementById('fontPrefix').value || '';
        fontPrefix = fontPrefix == "" || fontPrefix == null ? '' : fontPrefix + '-';
        const cls = `i-${fontPrefix}${icon.name}`;

        // 데이터 채우기
        preview.innerHTML = icon.data;
        iconNameTxt.innerHTML = icon.name;
        iconCode.innerHTML = icon.code;
        iconTag.innerText = `<i class="${cls}" aria-hidden="true"></i>`;
        iconCss.innerHTML = `.${cls}`;
        iconVariable.innerHTML = `var(--i-${fontPrefix}${icon.name})`;
        iconNameInput.value = icon.name;

        // 아이콘 정보 저장
        _private.editIcon.name = iconName;
        _private.editIcon.idx = iconIdx;

        // 모달 열기
        modal.open('#editModal');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    layout_main.init();
    form_main.init();
    card_main.init();
    edit_main.init(); 
});