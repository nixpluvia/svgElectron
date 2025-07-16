
const modal = ueye.modal();
const dropbox = ueye.dropbox({
    animation : true,
});

const _private = {
    isShiftPressed: false,
    prevChecked : null,
    optimizedIcons: [],
}
const _repository = {
    title: 'svg-electron',
    version: '1.0.0',
    description: 'SVG Font Generator using Electron',
    fontName: 'MyCustomFont',
    fontPrefix : '',
    icons : [],
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
});

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

// 아이콘 전체 선택/해제 메서드
function selectAllIcons() {
    const checkboxes = document.querySelectorAll('input[name="iconSelect"]');
    const allChecked = Array.from(checkboxes).every(cb => cb.checked);
    checkboxes.forEach(cb => cb.checked = !allChecked);
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
// 아이콘 선택 삭제 메서드
function deleteSelectedIcons() {
    const selectedIcons = document.querySelectorAll('input[name="iconSelect"]:checked');
    if (selectedIcons.length === 0) {
        ueye.toast.action({
            status: 'warning',
            message: '삭제할 아이콘을 선택해주세요.',
            type : 'mini'
        });
        return;
    }
    // 선택된 아이콘 삭제
    const iconNamesToDelete = Array.from(selectedIcons).map(cb => cb.value);
    _repository.icons = _repository.icons.filter(icon => !iconNamesToDelete.includes(icon.name));
    iconNamesToDelete.forEach(iconName => {
        const iconCard = document.querySelector(`.icon-card[data-icon-name="${iconName}"]`);
        if (iconCard) {
            iconCard.remove();
        }
    });
    ueye.toast.action({
        status: 'success',
        message: `선택된 아이콘이 삭제되었습니다.`,
        type : 'mini'
    });
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