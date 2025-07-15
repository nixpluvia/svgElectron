/*-------------------------------------------------------------------
    @익스플로러 전환 엣지로 전환
-------------------------------------------------------------------*/
if(/MSIE \d|Trident.*rv:/.test(navigator.userAgent)) {
    window.location = 'microsoft-edge:' + window.location;

    setTimeout(function() {
        window.location = 'https://go.microsoft.com/fwlink/?linkid=2135547';
    }, 1);
}

/*-------------------------------------------------------------------
    @Core / Core
-------------------------------------------------------------------*/
(function(global){
    var core = (function(){
        const browsers = ['Chrome', 'Opera', 'WebTV', 'Whale', 'Beonex', 'Chimera', 'NetPositive', 'Phoenix', 'Firefox', 'Safari', 'SkipStone', 'Netscape', 'Mozilla'];
        const mobile = ['Android','webOS','iPhone','iPad','iPod','BlackBerry','IEMobile','Opera Mini'];
        const userAgent = window.navigator.userAgent;
        
        // 구버전 clipboard copy
        function fallbackCopy(textToCopy) {
            var tempTextArea = document.createElement("textarea");
            tempTextArea.value = textToCopy;
            document.body.appendChild(tempTextArea);
            tempTextArea.select();
            tempTextArea.setSelectionRange(0, 99999);
        
            try {
                var successful = document.execCommand('copy');
                if (successful) {
                    // alert('텍스트가 클립보드에 복사되었습니다.');
                    ueye.toast.action({
                        status: 'info',
                        message: '클립보드에 복사되었습니다.',
                        type : 'mini'
                    });
                } else {
                    // alert('복사에 실패했습니다.');
                    ueye.toast.action({
                        status: 'info',
                        message: '클립보드에 복사되었습니다.',
                        type : 'mini'
                    });
                }
            } catch (err) {
                console.error('클립보드 복사 중 오류가 발생했습니다.', err);
                alert('복사 기능을 사용할 수 없습니다.');
            }
            document.body.removeChild(tempTextArea);
        }

        var public = {
            /*-------------------------------------------------------------------
                @정보
            -------------------------------------------------------------------*/
            //브라우저 체크
            getBrowser : function(){
                var ua = userAgent.toLowerCase();
                if (ua.includes("edg")) return "Edge";
                if (ua.includes("trident") || ua.includes("msie")) return "Internet Explorer";
        
                return browsers.find((browser) => ua.includes(browser.toLowerCase())) || 'Other';
            },
            //디바이스 체크
            getDevice : function(){
                var device = "PC"
                mobile.forEach(function(val, i){
                    if(userAgent.indexOf(val) >= 0) device = "Mobile";
                })
                return device;
            },

            /*--------------------------------------------------------------
                @변환
            --------------------------------------------------------------*/
            //숫자 콤마 추가
            comma : function(number) {
                if (typeof num !== 'number' && isNaN(Number(number))) return false; // 숫자가 아닌 입력 처리

                try {
                    return Number(number).toLocaleString();
                } catch (e) {
                    number = String(number);
                    return number.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
                }
            },
            //숫자 콤마 제거
            uncomma : function(number){
                return number.toString().replace(/,/g, '');
            },
            //숫자만 출력
            onlynumber : function(str) {
                str = String(str);
                return str.replace(/[^\d]+/g, '');
            },
            //숫자 제외 출력
            onlyText : function(str) {
                return str.replace(/[0-9]/g, '');
            },
            //한글만 출력
            onlyKorean : function(str) {
                str = String(str);
                return str.replace(/[^가-힣]+/g, '');
            },
            //영문만 출력
            onlyEnglish : function(str) {
                str = String(str);
                return str.replace(/[^a-zA-Z]+/g, '');
            },
            deepCopy : function(obj){
                return JSON.parse(JSON.stringify(obj));
            },
            //클립보드 카피
            copyToClipboard : function(textToCopy) {
                if (navigator.clipboard && window.isSecureContext) {
                    navigator.clipboard.writeText(textToCopy).then(function() {
                        // alert('클립보드에 복사되었습니다.');
                        ueye.toast.action({
                            status: 'info',
                            message: '클립보드에 복사되었습니다.',
                            type : 'mini'
                        });
                    }).catch(function(err) {
                            console.error('클립보드에 복사할 수 없습니다.', err);
                            fallbackCopy(textToCopy);
                    });
                } else {
                    fallbackCopy(textToCopy);
                }
            },
        };

        return public;
    })();
    
    global.core = core;
})(window);


/*--------------------------------------------------------------
    @Cookie
--------------------------------------------------------------*/
core.cookie = (function(){
    return {
        /**
         * 쿠키 가져오기
         * @param {string} name - 설정된 쿠키 이름
         * @returns {string|Null} - 키 O 해당 값만 출력, 키 X 전체 출력
         */
        get : function(name){
            var nameEQ = name + "=";
            var cArr = document.cookie.split(';');
            for (var i = 0; i < cArr.length; i++) {
                var c = cArr[i].trim();
                if (c.indexOf(nameEQ) == 0) return decodeURIComponent(c.substring(nameEQ.length, c.length));
            }
            return null;
        },
        
        /**
         * 쿠키 설정
         * @param {string} name - 쿠키 이름
         * @param {string} value - 쿠키 값
         * @param {string} days - 쿠키 유효기간(날짜)
         * @param {Object} options - 쿠키 기타 옵션
         */
        set : function(name, value, days, options){
            var expires = "";
            if (days) {
                var date = new Date();
                date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
                expires = "; expires=" + date.toUTCString();
            }
            var option =  "; path=/";
            if (options) {hasOwnProperty
                for (var key in options) {
                    option += '; ' + key + '=' + options[key];
                }
            }
            document.cookie = name + "=" + encodeURIComponent(value || "") + expires + option;
        },

        /**
         * 쿠키 삭제
         * @param {string} name - 설정된 쿠키 이름
         */
        remove : function(name){
            document.cookie = name + '=; Max-Age=-99999999;';
        },
    }
})();


/*--------------------------------------------------------------
    @storage
--------------------------------------------------------------*/
core.storage = (function(){
    return {
        getLocal : function(key){
            return JSON.parse(window.localStorage.getItem(key));
        },
        getAllLocal : function() {
            let data = {};
            for (let i = 0; i < localStorage.length; i++) {
              let key = localStorage.key(i);
              data[key] = JSON.parse(localStorage.getItem(key));
            }
            return data;
        },
        setLocal : function(key, value){
            window.localStorage.setItem(key, JSON.stringify(value));
        },
        removeLocal : function(key){
            window.localStorage.removeItem(key);
        },
        getSession : function(key){
            return JSON.parse(window.sessionStorage.getItem(key));
        },
        getAllSession : function() {
            let data = {};
            for (let i = 0; i < sessionStorage.length; i++) {
              let key = sessionStorage.key(i);
              data[key] = JSON.parse(sessionStorage.getItem(key));
            }
            return data;
        },
        setSession : function(key, value){
            window.sessionStorage.setItem(key, JSON.stringify(value));
        },
        removeSession : function(key){
            window.sessionStorage.removeItem(key);
        },
    }
})();


/*--------------------------------------------------------------
    @파라미터 (쿼리스트링)
--------------------------------------------------------------*/
core.param = (function(){
    var urlParams = new URLSearchParams(window.location.search);

    return {
        /**
         * 쿼리 가져오기
         * @param {string} key - 설정된 키
         * @returns {string|Object} - 키 O 해당 값만 출력, 키 X 전체 출력
         */
        get : function(key){
            if (key != undefined && urlParams.has(key)) { //해당 키 값의 파라미터만 가져오기
                return urlParams.get(key);
            }
            var params = {};
            for (var [k, v] of urlParams.entries()) {
                params[k] = v;
            }
            return params;
        },

        /**
         * 쿼리 설정
         * @param {string} key - 설정할 키
         * @param {string} value - 설정할 값
         */
        set : function(key, value){
            if (urlParams.has(key)) {
                urlParams.set(key, value);
            } else {
                urlParams.append(key, value);
            }
            this.update();
        },

        /**
         * 쿼리 삭제
         * @param {string} key - 설정된 키
         */
        remove : function(key){
            urlParams.delete(key);
            this.update();
        },

        /**
         * 주소 업데이트
         */
        update : function(){
            const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname + '?' + urlParams.toString();
            window.history.replaceState(null, '', newUrl);
        }
    }
})();


/*--------------------------------------------------------------
    @keyboard
--------------------------------------------------------------*/
core.keyboard = (function(){

    return {
        /**
         * 탭 키(focus) 방향
         * @returns 
         */
        getTabDir : function(){
            var keyCode = e.keyCode || e.which;
            if (keyCode == 9) {
                return e.shiftKey ? "prev" : "next";
            }
            return false;
        },
        /**
         * 조합키 확인
         * @param {KeyboardEvent} event - 키보드 이벤트 객체
         * @returns {Array} // 눌린 조합 키 문자열의 배열
         */
        getModifierKey : function(event){
            let keysPressed = [];
            if (event.shiftKey) {
                keysPressed.push('Shift');
            }
            if (event.ctrlKey) {
                keysPressed.push('Ctrl');
            }
            if (event.altKey) {
                keysPressed.push('Alt');
            }
            return keysPressed;
        },
        /**
         * 키 확인
         * @param {KeyboardEvent} event - 키보드 이벤트 객체
         * @returns {String} // 눌린 키 문자열
         */
        getKeyName : function(event) {
            let keyName = '';
        
            switch (event.keyCode) {
                case 9: keyName = 'Tab';
                    break;
                case 13: keyName = 'Enter';
                    break;
                case 16: keyName = 'Shift';
                    break;
                case 17: keyName = 'Control';
                    break;
                case 18: keyName = 'Alt';
                    break;
                case 27: keyName = 'Escape';
                    break;
                case 32: keyName = 'Space';
                    break;
                // Add more cases as needed for other keys
                default: keyName = '';
            }
        
            return keyName;
        }
    }
})();


/*--------------------------------------------------------------
    @animation
--------------------------------------------------------------*/
core.animation = (function(){
    let animations = new WeakMap(); // 각 요소별 애니메이션 저장
    
    // 애니메이션 중단
    function stop(element) {
        if (animations.has(element)) {
            cancelAnimationFrame(animations.get(element)); // 기존 애니메이션 중단
            animations.delete(element);
        }
    }

    function slideDown(element, duration = 400) {
        stop(element); // 기존 애니메이션이 있으면 중단

        let isStopped = false;
        if (window.getComputedStyle(element).display != 'none') isStopped = true;
        element.style.display = 'block';
        element.style.overflow = 'hidden';
        let computed = getComputedStyle(element);
        let nowHeight = parseFloat(computed.height);
        let totalHeight = element.scrollHeight;
        let initPaddingTop = parseFloat(computed.paddingTop) || 0;
        let initPaddingBottom = parseFloat(computed.paddingBottom) || 0;
        element.style.paddingTop = '0px';
        element.style.paddingBottom = '0px';
        element.style.height = parseFloat(computed.height);

        let startTime = performance.now();
        let correction = 0;
        if (isStopped) {
            correction = nowHeight / totalHeight; //높이 중단에 의한 progress 보정값값
        }

        function animate(time) {
            let elapsed = time - startTime;
            let progress = Math.min(elapsed / duration, 1) + correction;
            let easedProgress = _easeInOut(progress);
            element.style.paddingTop = (initPaddingTop * easedProgress) + "px";
            element.style.paddingBottom = (initPaddingBottom * easedProgress) + "px";
            element.style.height = (totalHeight * easedProgress) + 'px';

            if (progress < 1) {
                let animationId = requestAnimationFrame(animate);
                animations.set(element, animationId); // 애니메이션 ID 저장
            } else {
                // 완료 후 원래 높이로 설정
                element.style.height = ''; 
                element.style.paddingTop = '';
                element.style.paddingBottom = '';
                element.style.overflow = '';
                animations.delete(element);
            }
        }

        let animationId = requestAnimationFrame(animate);
        animations.set(element, animationId);
    }
    
    function slideUp(element, duration = 400) {
        stop(element); // 기존 애니메이션 중단

        element.style.overflow = 'hidden';
        let computed = getComputedStyle(element);
        let totalHeight = parseFloat(computed.height);
        let initPaddingTop = parseFloat(computed.paddingTop) || 0;
        let initPaddingBottom = parseFloat(computed.paddingBottom) || 0;
        element.style.height = totalHeight + 'px';

        let startTime = performance.now();

        function animate(time) {
            let elapsed = time - startTime;
            let progress = Math.min(elapsed / duration, 1);
            let easedProgress = _easeInOut(progress);
            element.style.paddingTop = (initPaddingTop * (1 - easedProgress)) + "px";
            element.style.paddingBottom = (initPaddingBottom * (1 - easedProgress)) + "px";
            element.style.height = (totalHeight * (1 - easedProgress)) + 'px';

            if (progress < 1) {
                let animationId = requestAnimationFrame(animate);
                animations.set(element, animationId);
            } else {
                element.style.display = 'none';
                // 완료 후 원래 높이로 설정
                element.style.height = ''; 
                element.style.paddingTop = '';
                element.style.paddingBottom = '';
                element.style.overflow = '';
                animations.delete(element);
            }
        }

        let animationId = requestAnimationFrame(animate);
        animations.set(element, animationId);
    }

    function slideToggle(element, duration = 400) {
        if (window.getComputedStyle(element).display === 'none') {
            slideDown(element, duration);
        } else {
            slideUp(element, duration);
        }
    }

    // 트랜지션
    function _easeInOut(t) {
        return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    }
    

    return {
        slideDown : slideDown,
        slideUp : slideUp,
        slideToggle : slideToggle,
        stop : stop,
    }
})();