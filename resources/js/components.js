/*-------------------------------------------------------------------
    @ueye / Core
-------------------------------------------------------------------*/
(function(global){
    var ueye = (function(){
        const cores = {
            resize : {
                isRegistered : false,
                handlers : [],
                eventHandler : null,
                countId : 0,
                useDebounce : true,
                useThrottle : false,
                timeout : {
                    timer : null,
                    delay : 150,
                },                
            },
            docClick : {
                isRegistered : false,
                handlers : [],
                eventHandler : null,
                countId : 0,  
            },
            win : {
                width: null,
                height: null,
                bottom: null,
                top: null,
            },
            doc : {
                height : null,
            }
        };
        
        /**
         * 윈도우 기본 정보 설정
         */
        function setWindow(){ 
            cores.win.width = document.documentElement.clientWidth;
            cores.win.height = window.innerHeight;
            cores.win.top = window.scrollY || document.documentElement.scrollTop;
            cores.win.bottom = cores.win.top + cores.win.height;
        };
        /**
         * 윈도우 정보 가져오기
         * @param {boolean} isReset //정보 재설정
         * @returns 
         */
        function getWindow(isReset){
            if (isReset) setWindow();
            return {
                width : cores.win.width,
                height : cores.win.height,
                top : cores.win.top,
                bottom : cores.win.bottom,
            }
        }
        /**
         * 윈도우 position 정보만 재설정
         */
        function setWindowPosition(){
            cores.win.top = window.scrollY || document.documentElement.scrollTop;
            cores.win.bottom = cores.win.top + cores.win.height;
        }
        /**
         * Document 기본 정보 설정
         */
        function setDocument() {
            cores.doc.height = document.documentElement.scrollHeight;
        }
        /**
         * Document 정보 가져오기
         * @param {boolean} isReset //정보 재설정
         * @returns {Object}
         */
        function getDocument(isReset){
            if (isReset) setDocument();
            return {
                height : cores.doc.height,
            }
        }

        /**
         * 객체 깊은 복사
         * @param {Object} obj 
         * @returns 
         */
        function deepCopyObject(obj){
            return JSON.parse(JSON.stringify(obj));
        }

        /**
         * 디바운스
         * @param {*} func //실행함수
         * @param {*} timer //타이머 변수
         * @param {*} delay //실행 딜레이
         */
        function debounce (func, timeout) {
            clearTimeout(timeout.timer);
            timeout.timer = setTimeout(func, timeout.delay);
        };
        /**
         * 쓰로틀링
         * @param {*} func //실행함수
         * @param {*} timer //타이머 변수
         * @param {*} delay //실행 딜레이
         */
        function throttle (func, timeout) {
            if (!timeout.timer) {
                timeout.timer = setTimeout(function(){
                    timeout.timer = null;
                    func();
                }, timeout.delay);
            }
        };

        /**
         * 윈도우 리사이즈 이벤트
         */
        function _setWindowResize(){ 
            if (cores.resize.handlers.length < 1) return false;
            if (cores.resize.isRegistered == true) return false;
            cores.resize.isRegistered = true;
            
            if (cores.resize.useDebounce) { //디바운스 사용 (Default)
                cores.resize.eventHandler = debounce.bind(this, _resizeHandler, cores.resize.timeout);
            } else if (cores.resize.useThrottle){ //쓰로틀 사용
                cores.resize.eventHandler = throttle.bind(this, _resizeHandler, cores.resize.timeout);
            } else {
                cores.resize.eventHandler = _resizeHandler;
            }

            window.addEventListener('resize', cores.resize.eventHandler);
        };
        /**
         * 리사이즈 핸들러 실행
         */
        function _resizeHandler(){
            setWindow();
            cores.resize.handlers.forEach(obj=>obj.handler());
        };

        /**
         * 리사이즈 핸들러 등록
         * @param {function} handler 
         */
        function setResize(handler){
            var obj;
            if (typeof handler === 'object') {
                obj = handler;
            } else if (typeof handler == 'function'){
                obj = {
                    id : ++cores.resize.countId, //핸들러 아이디 생성
                    handler : handler,
                }
            }
            //핸들러 등록, 이벤트 등록
            cores.resize.handlers.push(obj);
            _setWindowResize();
            //핸들러 아이디 반환
            return obj.id;
        }
        /**
         * 리사이즈 핸들러 및 이벤트 삭제
         * @param {String, Number} handlerId //삭제할 Handler Id
         * @param {String} handlerName //삭제할 Handler 함수명
         */
        function removeResizeHandler(handlerId, handlerName){
            var flag = false;
            var handlerArr = cores.resize.handlers;
            for (let i = 0; i < handlerArr.length; i++) {
                if (handlerArr[i].id == handlerId || (typeof handlerArr[i].handler === 'function' && handlerArr[i].handler.name === handlerName)) {
                    handlerArr.splice(i, 1);
                    flag = true;
                    break;
                }
            }
            if (flag && handlerArr.length < 1) { // 등록된 handler 없을 경우
                window.removeEventListener('resize', cores.resize.eventHandler);
                cores.resize.isRegistered = false;
            }
        }



        /**
         * DOC 클릭 이벤트
         */
        function _setDocumentClick(){ 
            if (cores.docClick.isRegistered == true) return false;
            if (cores.docClick.handlers.length < 1) return false;
            cores.docClick.isRegistered = true;
            cores.docClick.eventHandler = _docClickHandler;

            document.addEventListener('click', cores.docClick.eventHandler);
        };
        /**
         * DOC 클릭 핸들러 실행
         */
        function _docClickHandler(event){
            const targetElement = event.target;

            cores.docClick.handlers.some(obj=> {
                try {
                    if (targetElement.closest(obj.target)) {
                        obj.handler.call(targetElement.closest(obj.target), event);
                        return true;
                    } else if (obj.target == null) {
                        obj.params ? obj.handler.call(this, event, obj.params) : obj.handler.call(this, event);
                    }
                } catch (error) {
                    console.error('Error executing click handler:', error);
                }
                return false;
            });
        };

        /**
         * DOC 클릭 핸들러 등록
         * @param {function} handler 
         */
        function setDocClick(target, handler, params){
            var obj;
            if (typeof handler === 'object') {
                obj = handler;
            } else if (typeof handler == 'function'){
                obj = {
                    id : ++cores.docClick.countId, //핸들러 아이디 생성
                    target : target || null,
                    handler : handler,
                    params : params,
                }
            }
            //핸들러 등록, 이벤트 등록
            cores.docClick.handlers.push(obj);
            _setDocumentClick();
            //핸들러 아이디 반환
            return obj.id;
        }
        /**
         * DOC 클릭 핸들러 및 이벤트 삭제
         * @param {String, Number} handlerId //삭제할 Handler Id
         * @param {String} functionName //삭제할 Handler 함수명
         */
        function removeDocClickHandler(handlerId, handlerName){
            var handlerArr = cores.docClick.handlers;
            var flag = false;
            for (let i = 0; i < handlerArr.length; i++) {
                if (handlerArr[i].id == handlerId || (typeof handlerArr[i].handler === 'function' && handlerArr[i].handler.name === handlerName)) {
                    handlerArr.splice(i, 1);
                    flag = true;
                    break; // 일치하는 핸들러를 찾으면 즉시 중단
                }
            }
            // 모든 핸들러가 제거되었을 경우 이벤트 리스너 제거
            if (flag && handlerArr.length < 1) {
                document.removeEventListener('click', cores.docClick.eventHandler);
                cores.docClick.isRegistered = false;
            }
        }


        function _ready(){
            document.addEventListener('DOMContentLoaded', ()=>{
                setWindow();
                setDocument();
            });
        }
        _ready();

        /*-------------------------------------------------------------------
            @public
        -------------------------------------------------------------------*/
        var public = {
            win : cores.win,
            setWindow : setWindow,
            getWindow : getWindow,
            setWindowPosition : setWindowPosition,
            setDocument : setDocument,
            getDocument : getDocument,
            deepCopyObject : deepCopyObject,
            debounce : debounce,
            throttle : throttle,
            setResize : setResize,
            removeResizeHandler :removeResizeHandler,
            setDocClick : setDocClick,
            removeDocClickHandler :removeDocClickHandler,
        }

        return public;
    })();
    
    global.ueye = ueye;
})(window);


/*-------------------------------------------------------------------
	분류그룹 : 이미지 관련 함수
-------------------------------------------------------------------*/
/**
 * 대체 이미지 설정
 * @param {instance} el // 이미지 element
 * @param {String} src // 이미지 경로
 */
ueye.imgError = function(el, src){
    el.onerror= null;
    el.src= src;
}

/**
 * WIDE 이미지 체크
 * @param {String} target //이미지 element
 */
ueye.findWideImg = function(target){
    var $el = $(target);
    $el.each(function(i, val){
        if (val.naturalHeight / val.naturalWidth < 1) {
            val.classList.add('wide');
        }
    });
}


/*-------------------------------------------------------------------
	분류그룹 : 스크롤 관련 함수
-------------------------------------------------------------------*/
ueye.scroll = (function(){
    //스크롤 코어 변수
    const cores = {
        scroll : {
            isRegistered : false,
            handlers : [],
            eventHandler : null,
            countId : 0,
            useDebounce : false,
            useThrottle : false,
            timeout : {
                timer : null,
                delay : 20,
            },
        },
        move: {
            animationFrameId : null,
            isAnimating: false,
        },
        toggle : {
            use : false,
            els : null,
            targetClass : '.scroll-toggle',
            activeClass : 'finded',
            resizeHandlerId : null,
            breakpoint : null,
        },
        loopToggle : {
            use : false,
            els : null,
            targetClass : '.scroll-loop-toggle',
            activeClass : 'finded',
            breakpoint : null,
        },
    }

    /**
     * 요소 위치 정보 - 절대좌표
     * @param {Element, String} element // 요소ID
     * @returns {Object} //절대값 top, left
     */
    function getOffset(element) {
        var el = element instanceof Element ? element : document.querySelector(element);
        var rect = el.getBoundingClientRect();
        var scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
        var scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        return {
            top: rect.top + scrollTop,
            left: rect.left + scrollLeft,
            bottom : rect.top + rect.height + scrollTop,
            width : rect.width,
            height : rect.height,
        };
    }
    /**
     * 요소 위치 정보 - 상대좌표
     * @param {Element, String} element // 요소ID
     * @returns {Object} //절대값 top, left
     */
    function getPosition(element) {
        var el = element instanceof Element ? element : document.querySelector(element);
        var rect = el.getBoundingClientRect();
        return {
            top: rect.top,
            left: rect.left,
            bottom : rect.top + rect.height,
            width : rect.width,
            height : rect.height,
        };
    }
    /**
     * 요소 좌표 Dataset 설정 (절대좌표)
     * @param {NodeList} elements
     */
    function _setElementsDataOffset(elements, targetObj){
        targetObj.posArr = [];
        elements.forEach(el=>{
            var pos = getOffset(el);
            el.setAttribute('data-pos-top', pos.top);
            el.setAttribute('data-pos-left', pos.left);
            el.setAttribute('data-pos-bottom', pos.bottom);
            targetObj.posArr.push({
                top: pos.top,
                left: pos.left,
                bottom: pos.bottom,
                offset : el.getAttribute('data-scroll-offset'),
            })
        });
    }

    /**
     * 스크롤 이벤트 등록
     */
    function _setScrollEvent(){ 
        if (cores.scroll.isRegistered == true) return false;
        if (cores.scroll.handlers.length < 1) return false;
        cores.scroll.isRegistered = true;
        ueye.getDocument();
        
        if (cores.scroll.useDebounce) { //디바운스 사용 (Default)
            cores.scroll.eventHandler = ueye.debounce.bind(this, _scrollHandler, cores.scroll.timeout);
        } else if (cores.scroll.useThrottle){ //쓰로틀 사용
            cores.scroll.eventHandler = ueye.throttle.bind(this, _scrollHandler, cores.scroll.timeout);
        } else {
            cores.scroll.eventHandler = _scrollHandler;
        }
        window.addEventListener('scroll', cores.scroll.eventHandler);
    };
    /**
     * 스크롤 핸들러 실행
     */
    function _scrollHandler(){
        ueye.setWindowPosition();
        cores.scroll.handlers.forEach(obj => obj.handler());
    };

    /**
     * 스크롤 이벤트 핸들러 등록
     * @param {function} handler // function handler
     */
    function setScroll(handler){
        var obj;
        if (typeof handler === 'object') {
            obj = handler;
        } else if (typeof handler === 'function'){
            ++cores.scroll.countId;
            obj = {
                id : cores.scroll.countId,
                handler : handler,
            }
        }
        //핸들러 등록, 이벤트 등록
        cores.scroll.handlers.push(obj);
        _setScrollEvent();
        //핸들러 아이디 반환
        return cores.scroll.countId;
    }

    /**
     * 스크롤 이벤트 핸들러 및 이벤트 삭제
     * @param {String, Number} handlerId //삭제할 Handler ID
     * @param {String} handlerName //삭제할 Handler 함수명
     */
    function removeScrollHandler(handlerId, handlerName){
        var flag = false;
        var handlerArr = cores.scroll.handlers;
        for (let i = 0; i < handlerArr.length; i++) {
            if (handlerArr[i].id === handlerId || (typeof handlerArr[i].handler === 'function' && handlerArr[i].handler.name === handlerName)) {
                handlerArr.splice(i, 1);
                flag = true;
                break;
            }
        }
        if (flag && handlerArr.length < 1) { // 등록된 handler 없을 경우
            window.removeEventListener('scroll', cores.scroll.eventHandler);
            cores.scroll.isRegistered = false;
        }
    }

    /**
     * 토글 클래스 스크롤
     * @param {Object} options 
     * @returns 
     */
    function toggleClass(options){
        if (options != null) {
            options.targetClass != undefined ? cores.toggle.targetClass = options.targetClass : null;
            options.activeClass != undefined ? cores.toggle.activeClass = options.activeClass : null;
        }
        cores.toggle.els = document.querySelectorAll(cores.toggle.targetClass);
        if (cores.toggle.els.length < 1) return false;

        ueye.setWindow();
        //요소 포지션 설정
        _setElementsDataOffset(cores.toggle.els, cores.toggle);
        //리사이즈 이벤트 등록
        cores.toggle.resizeHandlerId = ueye.setResize(_setElementsDataOffset.bind(null, cores.toggle.els, cores.toggle));
        //스크롤 이벤트 등록
        setScroll(_toggleScrollHandler);
        //기본시작
        _toggleScrollHandler();
    }
    /**
     * 토글 클래스 이벤트 핸들러
     */
    function _toggleScrollHandler(){
        var win = ueye.getWindow();
        var doc = ueye.getDocument();
        if (win.bottom >= parseInt(doc.height)) { //최하단
            cores.toggle.els.forEach(el =>{
                el.classList.add(cores.toggle.activeClass);
            });
            removeScrollHandler(null, '_toggleScrollHandler');
            ueye.removeResizeHandler(cores.toggle.resizeHandlerId);
            return;
        }
        
        cores.toggle.posArr = cores.toggle.posArr.filter((el, idx) => {
            var top = el.offset != null ? el.top + Number(el.offset) : el.top;
            if (win.bottom >= top) {
                document.querySelectorAll(cores.toggle.targetClass+'[data-pos-top="'+ el.top +'"]').forEach(element => {
                    element.classList.add(cores.toggle.activeClass);
                });
                return false;
            }
            return true;
        });
        if (cores.toggle.posArr.length < 1) {
            removeScrollHandler(null, '_toggleScrollHandler');
            ueye.removeResizeHandler(null, cores.toggle.resizeHandlerId);
        }
    }

    /**
     * 반복 토글 클래스 스크롤
     * @param {Object} options 
     * @returns 
     */
    function loopToggleClass(options){
        if (options != null) {
            options.targetClass != undefined ? cores.loopToggle.targetClass = options.targetClass : null;
            options.activeClass != undefined ? cores.loopToggle.activeClass = options.activeClass : null;
        }
        cores.loopToggle.els = document.querySelectorAll(cores.loopToggle.targetClass);
        if (cores.loopToggle.els.length < 1) return false;

        ueye.setWindow();
        //요소 포지션 설정
        _setElementsDataOffset(cores.loopToggle.els, cores.loopToggle);
        //리사이즈 이벤트 등록
        ueye.setResize(_setElementsDataOffset.bind(null, cores.loopToggle.els, cores.loopToggle.arr));
        //스크롤 이벤트 등록
        setScroll(_loopToggleScrollHandler);
        //기본시작
        _loopToggleScrollHandler();
    }
    /**
     * 반복 토글 클래스 이벤트 핸들러
     */
    function _loopToggleScrollHandler(){
        var win = ueye.getWindow();
        cores.loopToggle.posArr.filter((el, idx) => {
            var top = el.offset != null ? el.top + Number(el.offset) : el.top;
            var targets = document.querySelectorAll(cores.loopToggle.targetClass+'[data-pos-top="'+ el.top +'"]');
            if (win.bottom >= top) {
                targets.forEach(element => {
                    element.classList.add(cores.loopToggle.activeClass);
                });
            } else {
                targets.forEach(element => {
                    element.classList.remove(cores.loopToggle.activeClass);
                });
            }
        });
    }
    /**
     * 토글 스크롤 포지션 수동 업데이트
     */
    function updateTogglePosition(){
        if (cores.toggle.els != null && cores.toggle.els.length > 0) {
            if (cores.toggle.posArr.length > 0) _setElementsDataOffset(cores.toggle.els, cores.toggle);
        }
        if (cores.loopToggle.els != null && cores.loopToggle.els.length > 0) {
            _setElementsDataOffset(cores.loopToggle.els, cores.loopToggle);
        }
    }


    /**
     * Animation Bezier Calc
     * @param {Number} progress 
     * @returns {Number}
     */
    function _easeInOutCubic(progress) {
        return progress < 0.5 ? 4 * progress ** 3 : 1 - Math.pow(-2 * progress + 2, 3) / 2;
    }
    /**
     * 화면 이동 이벤트
     * @param {String, Number} target // 요소ID || 위치값
     * @param {*} time // 진행시간
     */
    function move(target, time, bumper){
        var top;
        if (isNaN(Number(target))) {
            top = this.getOffset(target).top;
        } else {
            top = target;
        }
        if (bumper != undefined) top += Number(bumper);
        var duration = time == undefined && isNaN(Number(time)) ? 600 : time;

        const startPosition = document.documentElement.scrollTop;
        const distance = top - startPosition;
        const startTime = performance.now();
      
        function scrollAnimation(currentTime) {
            const elapsedTime = currentTime - startTime;
            const progress = Math.min(elapsedTime / duration, 1);
            const easedProgress = _easeInOutCubic(progress);
            const nextPosition = startPosition + distance * easedProgress;
      
            document.documentElement.scrollTop = nextPosition;
      
            if (progress < 1 && cores.move.isAnimating) {
                cores.move.animationFrameId = requestAnimationFrame(scrollAnimation);
            } else {
                cores.move.isAnimating = false;
            }
        }

        if (cores.move.isAnimating) {
            cancelAnimationFrame(cores.move.animationFrameId);
        }
        
        cores.move.isAnimating = true;
        cores.move.animationFrameId = requestAnimationFrame(scrollAnimation); 
    }
    /**
     * 애니메이션 중단 함수
     */
    function stopMove(){
        if (cores.move.isAnimating) {
            cancelAnimationFrame(cores.move.animationFrameId);
            cores.move.isAnimating = false;
        }
    }

    return {
        getOffset : getOffset,
        getPosition : getPosition,
        setScroll : setScroll,
        removeScrollHandler : removeScrollHandler,
        toggleClass : toggleClass,
        loopToggleClass : loopToggleClass,
        updateTogglePosition : updateTogglePosition,
        move : move,
        stopMove : stopMove,
    };
})();


/*-------------------------------------------------------------------
	분류그룹 : 탭박스
-------------------------------------------------------------------*/
ueye.tabBox = (function(){
    function tabBox(options){
        var options = options || null;
        return new tabBox.fn.init(options);
    }

    /*-------------------------------------------------------------------
        @private
    -------------------------------------------------------------------*/
    var defaultOptions = {
        attr : {
            head : 'data-tab-head', //탭 wrap elements
            body : 'data-tab-body', //탭 컨텐츠 wrap
            type : 'data-tab-type', //탭 타입 (노말, 링크)
            con : 'data-tab-con', //탭 컨텐츠 wrap
            id : 'data-tab-id', //탭 구분 id값
            btn : 'data-tab', //탭 버튼 & 탭 컨텐츠
            trigger : 'data-tab-trigger',
        },
        type : ['default','drop'],
        activeClass : "active", //탭 액티브 클래스(노말)
        dropClass : "drop", //탭 액티브 클래스(링크)
        startWidth : 768, //드롭탭 변환 시작 클래스
        access : {
            active : "선택됨",
            inactive : "선택되지 않음",
        }
    }
    
    /*-------------------------------------------------------------------
        @private > 접근성 처리
    -------------------------------------------------------------------*/
    function _setAccess(options){
        var option = options;
        var attr = options.attr;
        //탭버튼
        var heads = document.querySelectorAll('['+ attr.head +']');
        heads.forEach((el)=>{
            el.setAttribute("role", "tablist");
        });
        var btns = Array.from(document.querySelectorAll('['+ attr.btn +']'));
        btns.forEach((el)=>{
            var id = el.getAttribute(attr.id);
            el.setAttribute("role", "tab");
            el.setAttribute("id", id);
            el.setAttribute("aria-controls", id+'Pannel');
            if (el.classList.contains(option.activeClass)) {
                el.setAttribute("title", option.access.active);
                el.setAttribute("aria-selected", "true");
                return;
            }
            el.setAttribute("title", option.access.inactive);
            el.setAttribute("aria-selected", "false");
        });
        //탭패널
        var pannels = Array.from(document.querySelectorAll('['+ attr.con +']'));
        pannels.forEach((el)=>{
            var id = el.getAttribute(attr.id);
            el.setAttribute("role", "tabpannel");
            el.setAttribute("id", id+'Pannel');
            el.setAttribute("aria-labelledby", id);
            if (el.classList.contains(option.activeClass)) {
                el.setAttribute("aria-hidden", "false");
                return;
            }
            el.setAttribute("aria-hidden", "true");
        });
    }

    /*-------------------------------------------------------------------
        @private > 클릭이벤트
    -------------------------------------------------------------------*/
    function _setClickEvent(ins){
        var option = ins.options;
        var attr = ins.options.attr;
        document.addEventListener('click', function(e) {
            const btn = e.target.closest('[' + attr.btn + '], [' + attr.trigger + ']');
            if (!btn) return;
                let tabName = btn.getAttribute(attr.btn);
                if (tabName !== null) {
                const tabId = btn.getAttribute(attr.id);
                // head
                const head = document.querySelector('[' + attr.head + '="' + tabName + '"]');
                const tabType = head ? head.getAttribute(attr.type) : undefined;
                const btns = head ? head.querySelectorAll('[' + attr.btn + ']') : [];
                // body
                const body = document.querySelector('[' + attr.body + '="' + tabName + '"]');
                const cons = body ? body.querySelectorAll('[' + attr.con + '="' + tabName + '"]') : [];
                const nowCon = body ? body.querySelector('[' + attr.con + '="' + tabName + '"][' + attr.id + '="' + tabId + '"]') : null;

                if (tabType === undefined) e.preventDefault(); // 클릭방지
                if (head) head.classList.remove(option.dropClass);
                if (!btn.classList.contains(option.activeClass)) {
                    btns.forEach(function(b) {
                        b.classList.remove(option.activeClass);
                        b.setAttribute('title', option.access.inactive);
                        b.setAttribute('aria-selected', 'false');
                    });
                    cons.forEach(function(c) {
                        c.classList.remove(option.activeClass);
                        c.setAttribute('aria-hidden', 'true');
                    });

                    btn.classList.add(option.activeClass);
                    btn.setAttribute('title', option.access.active);
                    btn.setAttribute('aria-selected', 'true');
                    if (nowCon) {
                        nowCon.classList.add(option.activeClass);
                        nowCon.setAttribute('aria-hidden', 'false');
                    }

                    if (tabType === "drop") {
                        const trigger = document.querySelector('[' + attr.trigger + '="' + tabName + '"]');
                        if (trigger) trigger.textContent = btn.textContent;
                    }
                }
            } else { // drop type
                tabName = btn.getAttribute(attr.trigger);
                const head = document.querySelector('[' + attr.head + '="' + tabName + '"]');
                if (ueye.win.width <= option.startWidth) {
                    e.preventDefault(); // 클릭방지
                    if (head) {
                        if (head.classList.contains(option.dropClass)) {
                            head.classList.remove(option.dropClass);
                        } else {
                            head.classList.add(option.dropClass);
                        }
                    }
                }
            }
        });
    }

    /**
     * DROP 형식 탭 타입 설정
     * @param {*} options 
     */
    function _setTabType(options){
        var option = options;
        var attr = options.attr;
        var heads = Array.from(document.querySelectorAll('['+ attr.head +']'));
        heads.forEach((el)=>{
            var type = el.getAttribute(attr.type);
            if (type == undefined) return;
            var group = el.getAttribute(attr.head);
            var $head = $(el);
            var $btn = $head.find('['+attr.btn+'="'+group+'"].'+option.activeClass).clone(false);
            $btn.attr(attr.trigger, group);
            $btn.removeAttr('id');
            $btn.removeAttr(attr.id);
            $btn.removeAttr(attr.btn);
            $btn.removeClass(option.activeClass);
            
            $head.prepend($('<li></li>').prepend($btn));
        });
    }

    /*-------------------------------------------------------------------
        @private > ready
    -------------------------------------------------------------------*/
    function _ready(ins){
        document.addEventListener('DOMContentLoaded', ()=>{
            _setAccess(ins.options);
            _setTabType(ins.options);
            _setClickEvent(ins);
        });
    }

    
    /*-------------------------------------------------------------------
        @public
    -------------------------------------------------------------------*/
    tabBox.fn = tabBox.prototype = {
        constructor: tabBox,
        //초기화
        init : function(options){
            this.options = ueye.deepCopyObject(defaultOptions);
            if (options == null) {
                _ready(this);
                return this;
            }

            if (options.namespace == undefined) { //네임 커스텀
                if (options.attr) {
                    options.attr.head != undefined ? this.attr.head = options.attr.head : null;
                    options.attr.btn != undefined ? this.attr.btn = options.attr.btn: null;
                    options.attr.type != undefined ? this.attr.type = options.attr.type : null;
                    options.attr.body != undefined ? this.attr.body = options.attr.body : null;
                    options.attr.con != undefined ? this.attr.con = options.attr.con : null;
                    options.attr.id != undefined ? this.attr.id = options.attr.id : null;
                }
            } else { //공통 네임
                this.attr.group = 'data-'+ namespace +'-group';
                this.attr.head = 'data-'+ namespace +'-head';
                this.attr.body = 'data-'+ namespace +'-body';
                this.attr.type = 'data-'+ namespace +'-type';
                this.attr.btn = 'data-'+ namespace;
                this.attr.con = 'data-'+ namespace +'-con';
                this.attr.id = 'data-'+ namespace +'-id';
            }
            if (options.access) { //접근성 변경
                options.access.active != undefined ? this.access.active : null;
                options.access.inactive != undefined ? this.access.inactive : null;
            }
            
            options.startWidth != undefined ? this.startWidth = options.startWidth : null;
            options.activeClass != undefined ? this.activeClass = options.activeClass : null;
            options.dropClass != undefined ? this.dropClass = options.dropClass : null;

            _ready(this);
            return this;
        },
        active : function(tabName, tabId){
            var option = this.options;
            var attr = this.options.attr;
            if (tabName == undefined || tabId == undefined) return false;
            // head
            var head = document.querySelector('['+attr.head+'="'+tabName+'"]');
            if (!head) return false;
            var tabType = head.getAttribute(attr.type);
            var btns = head.querySelectorAll('['+attr.btn+'="'+tabName+'"]');
            var btn = head.querySelector('['+attr.btn+'="'+tabName+'"]['+attr.id+'="'+ tabId +'"]');
            // body
            var body = document.querySelector('['+ attr.body +'="'+tabName+'"]');
            var cons = body ? body.querySelectorAll('['+attr.con+'="'+tabName+'"]') : [];
            var nowCon = body ? body.querySelector('['+attr.con+'="'+tabName+'"]['+attr.id+'="'+tabId+'"]') : null;

            head.classList.remove(option.activeClass);
            btns.forEach(function(b){
                b.classList.remove(option.activeClass);
                b.setAttribute('title', option.access.inactive);
                b.setAttribute('aria-selected', 'false');
            });
            cons.forEach(function(c){
                c.classList.remove(option.activeClass);
                c.setAttribute('aria-hidden', 'true');
            });

            if (btn) {
                btn.classList.add(option.activeClass);
                btn.setAttribute('title', option.access.active);
                btn.setAttribute('aria-selected', 'true');
            }
            if (nowCon) {
                nowCon.classList.add(option.activeClass);
                nowCon.setAttribute('aria-hidden', 'false');
            }

            if (tabType == "drop") {
                var trigger = document.querySelector('['+attr.trigger+'="'+tabName+'"]');
                if (trigger && btn) trigger.textContent = btn.textContent;
            }
        }
    };
    tabBox.fn.init.prototype = tabBox.fn;

    return tabBox;
})();




/**
 * 모달 컴포넌트
 * @return {instance} 인스턴스
 * @example
 * //사용법
 * const modal = ueye.modal();
 * modal.open(id); //열기
 * modal.close(id); //닫기
 */
ueye.modal = (function(){
    function modal(options){
        var options = options || null;
        return new modal.fn.init(options);
    }

    /*-------------------------------------------------------------------
        @private
    -------------------------------------------------------------------*/
    //기본 옵션
    const defaultOptions = {
        el : {
            focus : null,
        },
        attr : {
            modal : 'data-modal', //모달 요소
            btnOpen : 'data-modal-open', //열기 버튼
            btnClose : 'data-modal-close', //닫기 버튼
            prevent : "data-prevent-scroll",
        },
        activeClass : "active", //탭 액티브 클래스(노말)
        access : {
            active : "선택됨",
            inactive : "선택되지 않음",
        },
        callback : {
            open : {},
            close : {},
        },
        callbackParams : {
        }
    };
    //esc 이벤트 정보
    const escInfo = {
        ids : [],
        handlers : [],
    };
    // 스크롤 방지 정보
    const preventInfo = {
        count : 0,
    }
    
    /*-------------------------------------------------------------------
        @private > ESC 이벤트
    -------------------------------------------------------------------*/
    function _escEvent(e){
        var keyCode = e.keyCode || e.which;
        if (keyCode == 27) {
            var idx = escInfo.handlers.length - 1;
            escInfo.handlers[idx]();
        }
    }
    function _setEscHandler(ins, modalId){
        if (escInfo.handlers.length < 1) document.addEventListener('keydown', _escEvent); //이벤트 등록
        escInfo.ids.push(modalId);
        escInfo.handlers.push(close.bind(ins, '['+ ins.options.attr.modal + '="' + modalId + '"]'));
    }
    function _removeEscHandler(){
        escInfo.ids.pop();
        escInfo.handlers.pop();
        if (escInfo.handlers.length < 1) document.removeEventListener('keydown', _escEvent); //이벤트 해제
    }

    /*-------------------------------------------------------------------
        @private > 열기 클릭 이벤트
    -------------------------------------------------------------------*/
    function _setOpenEvent(ins){
        var option = ins.options;
        var attr = ins.options.attr;
        document.addEventListener('click', function(e) {
            let btnOpen = e.target.closest('['+attr.btnOpen+']'); // 가장 가까운 .btn 부모 요소 찾기
            if (btnOpen == null) return;
            let modalId = btnOpen.getAttribute(attr.btnOpen);
            let modal = document.querySelector('['+ attr.modal + '="' + modalId + '"]')
            if (modal.classList.contains(option.activeClass)) {
                close.call(ins, '['+ attr.modal + '="' + modalId + '"]');
            } else {
                open.call(ins, '['+ attr.modal + '="' + modalId + '"]', btnOpen);
            }
        });
    }

    /*-------------------------------------------------------------------
        @private > 닫기 클릭 이벤트
    -------------------------------------------------------------------*/
    function _setCloseEvent(ins){
        var attr = ins.options.attr;
        document.addEventListener('click', function(e) {
            let btnClose = e.target.closest('['+attr.btnClose+']');
            if (btnClose == null) return;
            e.preventDefault();
            var modalId = btnClose.getAttribute(attr.btnClose);

            close.call(ins, '['+ attr.modal + '="' + modalId + '"]');
        });
    }
    
    /*-------------------------------------------------------------------
        @private > focus 가두기 이벤트
    -------------------------------------------------------------------*/
    function _onFirstKeydown(focusEls, e){
        if (_getTabKeyup(e) === "prev") {
            e.preventDefault();
            focusEls[focusEls.length - 1].focus();
        }
    }
    function _onLastKeydown(focusEls, e){
        if (_getTabKeyup(e) === "next") { //마지막
            e.preventDefault();
            focusEls[0].focus();
        }
    }

    function _setFocusEvent(el, state){
        var modal = document.querySelector(el);
        var focusEls = modal.querySelectorAll('a, input, select, textarea, button');
        
        if (state != false || state == undefined) {
            //첫요소
            focusEls[0].addEventListener('keydown', _onFirstKeydown.bind(this, focusEls));
            focusEls[focusEls.length - 1].addEventListener('keydown', _onLastKeydown.bind(this, focusEls));
        } else {
            if (focusEls.length > 1) focusEls[0].removeEventListener('keydown', _onFirstKeydown);
            focusEls[focusEls.length - 1].removeEventListener('keydown', _onLastKeydown);
        }
    }
    function _getTabKeyup(e){
        var keyCode = e.keyCode || e.which;
        if (keyCode == 9) {
            return e.shiftKey ? "prev" : "next";
        }
        return false;
    }

    /*-------------------------------------------------------------------
        @private > prevent
    -------------------------------------------------------------------*/
    function _toggleScrollPrevent(trigger, attr) {
        if (trigger) {
            preventInfo.count += 1;
            document.querySelector('body').setAttribute(attr, 'on');
        } else {
            preventInfo.count -= 1;
            if (preventInfo.count <= 0) {
                preventInfo.count = 0;
                document.querySelector('body').setAttribute(attr, 'off');
            };
        }
    }

    /*-------------------------------------------------------------------
        @private > 접근성 처리
    -------------------------------------------------------------------*/
    function _setAccess(options){
        var attr = options.attr;
        var modals = Array.from(document.querySelectorAll('['+ attr.modal +']'));
        modals.forEach((el)=>{
            el.setAttribute("role", "dialog");
            if (el.getAttribute("aria-hidden") == null) el.setAttribute("aria-hidden", "true");
        });
    }
    
    /*-------------------------------------------------------------------
        @private > ready
    -------------------------------------------------------------------*/
    function _ready(ins){
        document.addEventListener('DOMContentLoaded', ()=>{
            _setAccess(ins.options);
        });
        _setOpenEvent(ins);
        _setCloseEvent(ins);
    }


    /*-------------------------------------------------------------------
        @public
    -------------------------------------------------------------------*/
    /*-------------------------------------------------------------------
        @public > 열기, 닫기
    -------------------------------------------------------------------*/
    function open(modalElement, focusTarget) {
        var ins = this;
        var options = this.options;
        var modal = document.querySelector(modalElement);
        var modalId = modal.getAttribute(options.attr.modal);
        if (modalId == undefined || modal.classList.contains(options.activeClass)) return false;
        var btnOpen = document.querySelector('['+options.attr.btnOpen+'="' + modalId + '"]');
    
        modal.classList.add(options.activeClass);
        modal.setAttribute('aria-hidden', "false");
        modal.setAttribute('tabindex', 0);
        if (btnOpen) btnOpen.classList.add(options.activeClass);
        _toggleScrollPrevent(true, options.attr.prevent);
        //이벤트
        options.el.focus = focusTarget;
        _setEscHandler(this, modalId);
        _setFocusEvent(modalElement, true);
        setTimeout(function(){
            modal.focus();

            //콜백함수 실행
            if (ins.options.callback["open"][modal.id] != undefined) {
                let callbackParams = options.callbackParams?.[modal.id]?.open;
                if (callbackParams == undefined) callbackParams = null;
                ins.options.callback["open"][modal.id].call(ins, modalId, callbackParams);
            }
        }, 0);
    }
    
    function close(modalElement, focusTarget) {
        var ins = this;
        var options = this.options;
        var modal = document.querySelector(modalElement);
        var modalId = modal.getAttribute(options.attr.modal);
        if (modalId == undefined || !modal.classList.contains(options.activeClass)) return false;
        var btnOpen = document.querySelector('['+options.attr.btnOpen+'="' + modalId + '"]');

        if (options.el.focus) {
            if (options.el.focus instanceof Element) {
                options.el.focus.focus();
            } else {
                document.querySelector(options.el.focus).focus();
            }
        } else {
            if (focusTarget != undefined) {
                if (focusTarget instanceof Element) { //element 요소
                    focusTarget.focus();
                } else {
                    document.querySelector(focusTarget).focus();
                }
            } else {
                if (btnOpen){
                    btnOpen.focus();
                } else {
                    // document의 가장 첫번째 a나 button 태그로 이동
                    var firstFocusable = document.querySelector('a, button');
                    firstFocusable.focus();
                }
            }
        }
        modal.classList.remove(options.activeClass);
        modal.setAttribute('aria-hidden', "true");
        modal.setAttribute('tabindex', '-1');
        if (btnOpen) btnOpen.classList.remove(options.activeClass);
        _toggleScrollPrevent(false, options.attr.prevent);
        //이벤트
        _removeEscHandler();
        _setFocusEvent(modalElement, false);

        if (modal.querySelector("#map")) {
            let prevModalId = escInfo.ids.length > 0 ? escInfo.ids[escInfo.ids.length - 1] : null;
            ueye.map.relocate(null, prevModalId);
        }

        //콜백함수 실행
        if (ins.options.callback["close"][modal.id] != undefined) {
            let callbackParams = options.callbackParams?.[modal.id]?.close;
            if (callbackParams == undefined) callbackParams = null;
            ins.options.callback["close"][modal.id].call(ins, modalId, callbackParams);
        }
    }

    function setCallback(id, type, callback, {key, params} = {}){
        if (id == undefined || id == null) return false;
        if (type == undefined || type == null) return false;
        if (typeof callback === 'function') {
            const callbackId = id.replace('#', '');

            // 콜백 파라미터 설정
            if (key != undefined && params != undefined) {
                if (this.options.callbackParams[key] == undefined) {
                    this.options.callbackParams[key] = {
                        key : params != undefined ? {...params} : {},
                    }
                } else {
                    this.options.callbackParams[key][type] = params != undefined ? {...params} : {};
                }
            }

            this.options.callback[type][callbackId] = callback;
        } else {
            console.error('Callback function is not valid.');
        }
    }

    /*-------------------------------------------------------------------
        @public > 초기화
    -------------------------------------------------------------------*/
    modal.fn = modal.prototype = {
        constructor: modal,
        // 초기화
        init : function(options){
            this.options = ueye.deepCopyObject(defaultOptions);
            if (options == null) {
                _ready(this);
                return this;
            }

            if (options.namespace == undefined) { //네임 커스텀
                if (options.attr) {
                    options.attr.group != undefined ? this.options.attr.group = options.attr.group : null;
                }
            } else { //공통 네임
                this.options.attr.modal = 'data-'+ options.namespace;
                this.options.attr.btnOpen = 'data-'+ options.namespace +'-open';
                this.options.attr.btnClose = 'data-'+ options.namespace +'-close';
            }
            options.activeClass != undefined ? this.options.activeClass = options.activeClass : null;

            _ready(this);
            return this;
        },
        // 모달 수동 열기
        open : open,
        // 모달 수동 닫기
        close : close,
        // 모달 콜백 설정
        setCallback : setCallback,
    };
    modal.fn.init.prototype = modal.fn;

    return modal;
})();


/**
 * 아코디언 컴포넌트
 * @return {instance} 인스턴스
 * @example
 * //사용법
 * const accordion = ueye.accordion();
 * accordion.open(id); //열기
 * accordion.close(id); //닫기
 */
ueye.accordion = (function(){
    function accordion(options){
        var options = options || null;
        return new accordion.fn.init(options);
    }

    /*-------------------------------------------------------------------
        @private
    -------------------------------------------------------------------*/
    //기본 옵션
    const defaultOptions = {
        attr : {
            group : 'data-acr-group',
            list : 'data-acr-list',
            con : 'data-acr-con',
            item : 'data-acr-item',
            btn : 'data-acr-btn',
            depth : 'data-acr-depth',
            speed : 'data-acr-speed',
            indie : 'data-acr-indie',
            closeAll : 'data-acr-close-all',
        },
        activeClass : 'active',
        foldClass : 'fold',
        linkClass : 'link',
        isCloseAll : false,
        isIndie : false,
        speed: 400,
        access : {
            active : "접기",
            inactive : "펼치기",
        },
    };

    /*-------------------------------------------------------------------
        @private > 초기화
    -------------------------------------------------------------------*/
    //하위 요소 체크
    function _initFoldState(){
        const ins = this;
        const options = ins.options;
        const attr = options.attr;
        document.querySelectorAll('[' + attr.list + ']').forEach((list) => {
            const parentLists = list.closest('[' + attr.list + ']') ? list.closest('[' + attr.list + ']') : null;
            const parentListCount = parentLists ? parentLists.length : 0;
            list.setAttribute(attr.depth, parentListCount + 1);

            list.querySelectorAll('[' + attr.item + ']').forEach((item) => {
                const btn = item.querySelector('[' + attr.btn + ']');
                // sub
                const subList = item.querySelector('[' + attr.list + ']');
                const subCon = item.querySelector(':scope > [' + attr.con + ']');
                if (!subList && !subCon) return;

                if (btn) {
                    btn.setAttribute('title', options.access.inactive);
                    btn.setAttribute('role', 'button');
                    btn.classList.add(options.foldClass);
                }
            });
        });
    }
    //active 상태 체크
    function _initListActive(){
        var ins = this;
        var options = ins.options;
        var attr = options.attr;

        var groups = document.querySelectorAll('[' + attr.group + ']');
        groups.forEach(function(group) {
            var activeBtns = group.querySelectorAll('[' + attr.btn + '].' + options.activeClass);
            // 아코디언 형식 여부
            var isIndie = group.getAttribute(attr.indie);
            isIndie = isIndie === undefined ? options.isIndie : isIndie;

            if (isIndie == false || isIndie === 'false') {
                if (activeBtns.length > 0) {
                    var i = activeBtns.length - 1;
                    _openSub.call(ins, activeBtns[i]);
                }
            } else {
                activeBtns.forEach(function(btn) {
                    _openSub.call(ins, btn);
                });
            }
        });
    }
    //리스트 전체 오픈
    function _openSub(el){
        var options = this.options;
        var attr = options.attr;
        var btn = typeof el === 'string' ? document.querySelector(el) : el;
        var id = btn.getAttribute(attr.btn);

        // 상위 요소 open
        var con = btn.nextElementSibling && btn.nextElementSibling.hasAttribute(attr.con) && btn.nextElementSibling.getAttribute(attr.con) === id
            ? btn.nextElementSibling
            : null;
        var lists = [];
        var parent = btn.parentElement;
        while (parent) {
            if (parent.hasAttribute && parent.hasAttribute(attr.list) && parent.getAttribute(attr.list) === id && parent.getAttribute(attr.depth) !== "1") {
                lists.push(parent);
            }
            parent = parent.parentElement;
        }
        var items = [];
        parent = btn.parentElement;
        while (parent) {
            if (parent.hasAttribute && parent.hasAttribute(attr.item) && parent.getAttribute(attr.item) === id) {
                items.push(parent);
            }
            parent = parent.parentElement;
        }
        items.forEach(function(item) {
            var childBtn = item.querySelector('[' + attr.btn + ']');
            if (childBtn) {
                childBtn.setAttribute('title', options.access.active);
                childBtn.setAttribute('aria-expanded', true);
                childBtn.classList.add(options.activeClass);
            }
        });
        lists.forEach(function(list) {
            list.classList.add(options.activeClass);
            list.setAttribute('aria-hidden', 'false');
            if (typeof $(list).stop === 'function') $(list).stop().slideDown(0);
        });
        if (con) {
            con.classList.add(options.activeClass);
            con.setAttribute('aria-hidden', 'false');
            if (typeof $(con).stop === 'function') $(con).stop().slideDown(0);
        }

        // 현재, 하위 요소 open
        var nowList = btn.closest('[' + attr.list + '="' + id + '"]');
        var depth = nowList ? parseInt(nowList.getAttribute(attr.depth)) : 1;
        var nowItem = btn.closest('[' + attr.item + '="' + id + '"]');
        var subList = nowItem ? nowItem.querySelector('[' + attr.list + '="' + id + '"][' + attr.depth + '="' + (depth + 1) + '"]') : null;
        if (subList) {
            subList.classList.add(options.activeClass);
            subList.setAttribute('aria-hidden', 'false');
            if (typeof $(subList).stop === 'function') $(subList).stop().slideDown(0);
        } else if (!con) {
            btn.removeAttribute('title');
            btn.removeAttribute('aria-expanded');
        }
    }

    /*-------------------------------------------------------------------
        @private > 클릭이벤트
    -------------------------------------------------------------------*/
    function _setClickEvent(ins){
        var options = ins.options;
        var attr = options.attr;
        document.addEventListener('click', function(e) {
            var btn = e.target.closest('[' + attr.btn + '].' + options.foldClass);
            if (!btn) return;
            e.preventDefault();
            if (btn.classList.contains(options.activeClass)) {
                close.call(ins, btn);
            } else {
                open.call(ins, btn);
            }
        });
    }
    /*-------------------------------------------------------------------
        @private > 클릭이벤트 > 실행 정보
    -------------------------------------------------------------------*/
    function _getInfo(btn) {
        var options = this.options;
        var attr = options.attr;

        var groupId = btn.getAttribute(attr.btn);
        var group = btn.closest('[' + attr.group + '="' + groupId + '"]');
        var list = btn.closest('[' + attr.list + '="' + groupId + '"]');
        var depth = list ? parseInt(list.getAttribute(attr.depth)) : 1;
        var item = btn.closest('[' + attr.item + '="' + groupId + '"]');
        var con = Array.from(btn.parentNode.children).find(
            el => el !== btn && el.hasAttribute(attr.con) && el.getAttribute(attr.con) === groupId
        );
        var subList = item
            ? item.querySelectorAll('[' + attr.list + '="' + groupId + '"][' + attr.depth + '="' + (depth + 1) + '"]')
            : [];

        // 아코디언 형식 여부
        var isIndie = group ? group.getAttribute(attr.indie) : undefined;
        isIndie = isIndie === undefined ? options.isIndie : isIndie;
        // 현재 그룹의 slide 속도
        var speed = group ? group.getAttribute(attr.speed) : undefined;
        speed = speed === undefined ? options.speed : speed;
        // 하위 메뉴 전체 닫기 여부
        var closeAll = group ? group.getAttribute(attr.closeAll) : undefined;
        closeAll = closeAll === undefined ? options.isCloseAll : closeAll;

        return {
            id: groupId,
            isIndie: isIndie,
            speed: speed,
            closeAll: closeAll,
            depth: depth, // 현재 버튼의 리스트의 depth
            group: group, // 아코디언 그룹
            list: list, // 현재 버튼의 리스트
            item: item, // 현재 버튼의 아이템
            con: con ? [con] : [],
            subList: subList // 현재 버튼의 하위 리스트 (NodeList)
        };
    }

    /*-------------------------------------------------------------------
        @private > 접근성 처리
    -------------------------------------------------------------------*/
    function _setAccess(options){

    }

    /*-------------------------------------------------------------------
        @private > ready
    -------------------------------------------------------------------*/
    function _ready(ins){
        document.addEventListener('DOMContentLoaded', ()=>{
            _setAccess(ins.options);
            _initFoldState.call(ins);
            _initListActive.call(ins);
        });
        _setClickEvent(ins);
    }


    /*-------------------------------------------------------------------
        @public
    -------------------------------------------------------------------*/
    /*-------------------------------------------------------------------
        @public > 열기, 닫기
    -------------------------------------------------------------------*/
    function open(btn){
        //설정
        var btnEl = typeof btn === 'string' ? document.querySelector(btn) : btn;
        var options = this.options;
        var attr = options.attr;
        var info = _getInfo.call(this, btnEl);

        // 독립실행 X
        if (info.isIndie == false || info.isIndie === 'false') {
            // 현재 리스트의 아이템들
            var items = info.item?.parentElement?.querySelectorAll('[' + attr.item + '="' + info.id + '"]') || [];
            var activeBtns = [];
            var activeLists = [];
            var activeCons = [];

            if (info.closeAll == false || info.closeAll === 'false') {
                // 전체 닫기 X (기본)
                items.forEach(function(item) {
                    var childBtn = item.querySelector('[' + attr.btn + '="' + info.id + '"].' + options.activeClass);
                    if (childBtn && childBtn !== btnEl) activeBtns.push(childBtn);

                    var childList = item.querySelector('[' + attr.list + '="' + info.id + '"][' + attr.depth + '="' + (info.depth + 1) + '"].' + options.activeClass);
                    if (childList) activeLists.push(childList);
                });
            } else {
                // 전체 닫기 O
                items.forEach(function(item) {
                    var childBtns = item.querySelectorAll('[' + attr.btn + '="' + info.id + '"].' + options.activeClass);
                    childBtns.forEach(function(childBtn) {
                        if (childBtn !== btnEl) activeBtns.push(childBtn);
                    });
                    var childLists = item.querySelectorAll('[' + attr.list + '="' + info.id + '"].' + options.activeClass);
                    childLists.forEach(function(childList) {
                        activeLists.push(childList);
                    });
                });
            }

            items.forEach(function(item) {
                var cons = item.querySelectorAll('[' + attr.con + '="' + info.id + '"].' + options.activeClass);
                cons.forEach(function(con) {
                    activeCons.push(con);
                });
            });

            activeBtns.forEach(function(b) {
                b.setAttribute('title', options.access.inactive);
                b.classList.remove(options.activeClass);
            });
            activeLists.forEach(function(l) {
                l.classList.remove(options.activeClass);
                core.animation.slideUp(l, info.speed);
            });
            activeCons.forEach(function(c) {
                c.classList.remove(options.activeClass);
                core.animation.slideUp(c, info.speed);
            });
        }

        // Default
        btnEl.setAttribute('title', options.access.active);
        btnEl.setAttribute('aria-expanded', true);
        btnEl.classList.add(options.activeClass);

        if (info.subList && info.subList.length > 0) {
            info.subList.forEach(function(sub) {
                sub.classList.add(options.activeClass);
                core.animation.slideDown(sub, info.speed);
                sub.setAttribute('aria-hidden', 'false');
            });
        } else if (info.con && info.con.length > 0) {
            info.con.forEach(function(con) {
                con.classList.add(options.activeClass);
                core.animation.slideDown(con, info.speed);
                con.setAttribute('aria-hidden', 'false');
            });
        }
    }

    function close(btn){
        // 설정
        var btnEl = typeof btn === 'string' ? document.querySelector(btn) : btn;
        var options = this.options;
        var attr = options.attr;
        var info = _getInfo.call(this, btnEl);

        // 전체 닫기 O
        if (info.closeAll == true || info.closeAll === 'true') {
            var items = info.item?.parentElement?.querySelectorAll('[' + attr.item + '="' + info.id + '"]') || [];
            items.forEach(function(item) {
                var subBtns = item.querySelectorAll('[' + attr.btn + '="' + info.id + '"].' + options.activeClass);
                subBtns.forEach(function(subBtn) {
                    subBtn.classList.remove(options.activeClass);
                    subBtn.setAttribute('title', options.access.inactive);
                    subBtn.setAttribute('aria-expanded', false);
                });

                var subLists = item.querySelectorAll('[' + attr.list + '="' + info.id + '"]');
                subLists.forEach(function(subList) {
                    subList.classList.remove(options.activeClass);
                    core.animation.slideDown(subList, info.speed);
                });
            });
        }

        // Default
        btnEl.setAttribute('title', options.access.inactive);
        btnEl.setAttribute('aria-expanded', false);
        btnEl.classList.remove(options.activeClass);

        if (info.subList && info.subList.length > 0) {
            info.subList.forEach(function(sub) {
                sub.classList.remove(options.activeClass);
                core.animation.slideDown(sub, info.speed);
                sub.setAttribute('aria-hidden', 'true');
            });
        } else if (info.con && info.con.length > 0) {
            info.con.forEach(function(con) {
                con.classList.remove(options.activeClass);
                core.animation.slideUp(con, info.speed);
                con.setAttribute('aria-hidden', 'true');
            });
        }
    }

    /*-------------------------------------------------------------------
        @public > init
    -------------------------------------------------------------------*/
    accordion.fn = accordion.prototype = {
        constructor: accordion,
        // 초기화
        init : function(options){
            this.options = ueye.deepCopyObject(defaultOptions); //옵션 카피
            if (options == null) {
                _ready(this);
                return this;
            }
            if (options.namespace == undefined) { //네임 커스텀
                if (options.attr) {
                    options.attr.group != undefined ? this.options.attr.group = options.attr.group : null;
                    options.attr.list != undefined ? this.options.attr.list = options.attr.list : null;
                    options.attr.item != undefined ? this.options.attr.item = options.attr.item : null;
                    options.attr.btn != undefined ? this.options.attr.btn = options.attr.btn : null;
                    options.attr.depth != undefined ? this.options.attr.depth = options.attr.depth : null;
                    options.attr.speed != undefined ? this.options.attr.speed = options.attr.speed : null;
                    options.attr.indie != undefined ? this.options.attr.indie = options.attr.indie : null;
                    options.attr.closeAll != undefined ? this.options.attr.closeAll = options.attr.closeAll : null;
                }
            } else { //공통 네임
                this.options.attr.group = 'data-'+ options.namespace +'-group';
                this.options.attr.list = 'data-'+ options.namespace +'-list';
                this.options.attr.item = 'data-'+ options.namespace +'-item';
                this.options.attr.btn = 'data-'+ options.namespace +'-btn';
                this.options.attr.depth = 'data-'+ options.namespace +'-depth';
                this.options.attr.speed = 'data-'+ options.namespace +'-speed';
                this.options.attr.indie = 'data-'+ options.namespace +'-indie';
                this.options.attr.closeAll = 'data-'+ options.namespace +'-close-all';
            }
            options.activeClass != undefined ? this.options.activeClass = options.activeClass : null;
            options.foldClass != undefined ? this.options.foldClass = options.foldClass : null;
            options.linkClass != undefined ? this.options.linkClass = options.linkClass : null;
            options.isCloseAll != undefined ? this.options.isCloseAll = options.isCloseAll : null;
            options.isIndie != undefined ? this.options.isIndie = options.isIndie : null;
            options.speed != undefined ? this.options.speed = options.speed : null;

            _ready(this);
            return this;
        },
        open : open,
        close : close,
    };
    accordion.fn.init.prototype = accordion.fn;

    return accordion;
})();


/**
 * 전체 체크박스 컴포넌트
 * @return {instance} 인스턴스
 * @example
 * //사용법
 * const checkAll = ueye.checkAll();
 * checkAll.toggleAll(id, toggle); //전체체크, 해제
 */
ueye.checkAll = (function(){
    function checkAll(options, call){
        var options = options || null;
        return new checkAll.fn.init(options, call);
    }

    /*-------------------------------------------------------------------
        @private
    -------------------------------------------------------------------*/
    //기본 옵션
    const defaultOptions = {
        attr : {
            wrap : 'data-check-wrap',
            el : 'data-check',
            all : 'data-check-all',
        },
        activeClass : 'active',
    };

    /*-------------------------------------------------------------------
        @private > 체크박스 이벤트
    -------------------------------------------------------------------*/
    function _setEvent(ins){
        document.addEventListener('change', function(event) {
            var target = event.target;
            if (target.matches('[' + ins.options.attr.all + ']')) {
                _handleCheckAll.call(target, ins);
            } else if (target.matches('[' + ins.options.attr.el + ']')) {
                _handleCheckbox.call(target, ins);
            }
        });
    }

    //전체 체크박스
    function _handleCheckAll(ins){
        var options = ins.options;
        var attr = options.attr;

        var all = this;
        var id = all.getAttribute(attr.all);
        var wrap = all.closest('[' + attr.wrap + '="' + id + '"]');
        var els = wrap ? wrap.querySelectorAll('[' + attr.el + '="' + id + '"]') : document.querySelectorAll('[' + attr.el + '="' + id + '"]');

        // 체크여부 확인
        if (all.checked) {
            all.checked = true;
            els.forEach(function(el) { el.checked = true; });
        } else {
            all.checked = false;
            els.forEach(function(el) { el.checked = false; });
        }

        if (ins.options.callback) ins.options.callback();
    }

    //일반 체크박스
    function _handleCheckbox(ins){
        var options = ins.options;
        var attr = options.attr;

        var ck = this;
        var id = ck.getAttribute(attr.el);
        var wrap = ck.closest('[' + attr.wrap + '="' + id + '"]');
        var all, cks;
        if (wrap) {
            all = wrap.querySelector('[' + attr.all + '="' + id + '"]');
            cks = wrap.querySelectorAll('[' + attr.el + '="' + id + '"]');
        } else {
            all = document.querySelector('[' + attr.all + '="' + id + '"]');
            cks = document.querySelectorAll('[' + attr.el + '="' + id + '"]');
        }

        if (!ck.checked) {
            // 체크 해제일 경우
            if (all) all.checked = false;
        } else {
            var flag = true;
            cks.forEach(function(el) {
                if (!el.checked) flag = false;
            });

            if (flag) {
                if (all) all.checked = true;
            } else {
                if (all) all.checked = false;
            }
        }

        if (ins.options.callback) ins.options.callback();
    }

    

    function _ready(ins){
        document.addEventListener("DOMContentLoaded", function(){
            _setEvent(ins);
        });
    }

    /*-------------------------------------------------------------------
        @public > init
    -------------------------------------------------------------------*/
    checkAll.fn = checkAll.prototype = {
        constructor: checkAll,
        // 초기화
        init: function(options, call) {
            this.options = ueye.deepCopyObject(defaultOptions); //옵션 카피
            if (call !== undefined) this.options.callback = call;
            if (options == null) {
                _ready(this);
                return this;
            }

            if (options.namespace === undefined) { //네임 커스텀
                if (options.attr) {
                    if (options.attr.wrap !== undefined) this.options.attr.wrap = options.attr.wrap;
                    if (options.attr.el !== undefined) this.options.attr.el = options.attr.el;
                    if (options.attr.all !== undefined) this.options.attr.all = options.attr.all;
                }
            } else { //공통 네임
                this.options.attr.wrap = 'data-' + options.namespace + '-wrap';
                this.options.attr.el = 'data-' + options.namespace;
                this.options.attr.all = 'data-' + options.namespace + '-all';
            }

            _ready(this);
            return this;
        },
        toggleAll: function(id, toggle) {
            if (id === undefined || toggle === undefined) return false;
            var options = this.options;
            var attr = options.attr;
            var cks = document.querySelectorAll('[' + attr.el + '="' + id + '"]');
            var alls = document.querySelectorAll('[' + attr.all + '="' + id + '"]');

            if (toggle === true) {
                cks.forEach(function(el) { el.checked = true; });
                alls.forEach(function(el) { el.checked = true; });
            } else {
                cks.forEach(function(el) { el.checked = false; });
                alls.forEach(function(el) { el.checked = false; });
            }
        },
        getChecked: function(id) {
            var options = this.options;
            var attr = options.attr;
            var result = {
                count: 0,
                valueArray: [],
            };
            var alls = document.querySelectorAll('[' + attr.all + '="' + id + '"]');
            var cks = document.querySelectorAll('[' + attr.el + '="' + id + '"]');
            alls.forEach(function(el) {
                if (el.checked) {
                    result.valueArray.push(el.value);
                }
            });
            cks.forEach(function(el) {
                if (el.checked) {
                    result.valueArray.push(el.value);
                    result.count++;
                }
            });
            return result;
        }
    };
    checkAll.fn.init.prototype = checkAll.fn;

    return checkAll;
})();


/**
 * Breadcrumb
 * @return {function}
 * @example
 * //사용법
 * ueye.breadcrumb(); //class명 breadcrumb 사용시
 * ueye.breadcrumb('breadcrumb id');
 */
ueye.breadcrumb = (function(){
    var el = null;
    function breadcrumb(element){
        el = element == undefined ? '.breadcrumb' : element;
        if (document.querySelector(el) == null) return false;
        _checkOverflow(el);
        ueye.setResize(_checkOverflow);
    }

    function _checkOverflow(){
        var wrap = document.querySelector(el);
        var list = wrap.querySelector('.list');
        var lis = list.querySelectorAll('li');
        if (lis.length < 6 && list.scrollWidth > list.clientWidth != true) {
            wrap.classList.remove('skip');
        } else {
            wrap.classList.add('skip');
        }
    }

    return breadcrumb;
})();





/**
 * expand 컴포넌트
 * @description 클릭 이벤트에 따른 확장 기능
 * @return {instance} 인스턴스
 */
ueye.expand = (function(){
    const attr = {
        target : 'data-expand-target',
        trigger : 'data-expand-trigger',
    }
    /**
     * 확장 열기
     * @param {String} targetAttr 
     * @param {Function} callback 
     */
    function open(targetAttr, callback){
        const trigger = document.querySelector(`[${attr.trigger}="${targetAttr}"]`);
        const target = document.querySelector(`[${attr.target}="${targetAttr}"]`);

        if (trigger) {
            trigger.classList.add('active');
            trigger.setAttribute('title', '접기');
            trigger.setAttribute('aria-expanded', true);
        }
        if (target) {
            target.classList.add('active');
            target.setAttribute('aria-hidden', false);
        }
        //콜백함수 실행
        if (callback) callback.call(target);
    }
    /**
     * 확장 닫기
     * @param {String} targetAttr 
     * @param {Function} callback 
     */
    function close(targetAttr, callback){
        const trigger = document.querySelector(`[${attr.trigger}="${targetAttr}"]`);
        const target = document.querySelector(`[${attr.target}="${targetAttr}"]`);

        if (trigger) {
            trigger.classList.remove('active');
            trigger.setAttribute('title', '펼치기');
            trigger.setAttribute('aria-expanded', false);
        }
        if (target) {
            target.classList.remove('active');
            target.setAttribute('aria-hidden', true);
        }
        //콜백함수 실행
        if (callback) callback.call(target);
    }
    function init(){
        const triggers = document.querySelectorAll(`[${attr.trigger}]`);
        if (triggers.length > 0) {
            triggers.forEach(function(el){
                el.addEventListener('click', function(){
                    const targetAttr = this.getAttribute(attr.trigger);
                    const target = document.querySelector(`[${attr.target}="${targetAttr}"]`);
                    if (target && target.classList.contains('active')) {
                        this.classList.remove('active');
                        this.setAttribute('title', '펼치기');
                        this.setAttribute('aria-expanded', false);
                        target.classList.remove('active');
                        target.setAttribute('aria-hidden', true);
                    } else {
                        this.classList.add('active');
                        this.setAttribute('title', '접기');
                        this.setAttribute('aria-expanded', true);
                        target.classList.add('active');
                        target.setAttribute('aria-hidden', false);
                    }
                });
            });
        }
    }

    return {
        init : init,
        open : open,
        close : close,
    }
})();


/**
 * 드롭박스
 * @return {instance} 인스턴스
 * @example
 * //사용법
 * const dropbox = ueye.dropbox();
 * dropbox.toggle(id, toggle); //전체체크, 해제
 */
ueye.dropbox = (function(){
    function dropbox(options){
        var options = options || null;
        return new dropbox.fn.init(options);
    }

    /*-------------------------------------------------------------------
        @private
    -------------------------------------------------------------------*/
    //기본 옵션
    const defaultOptions = {
        attr : {
            wrap : 'data-dropbox-wrap',
            box : 'data-dropbox-target',
            button : 'data-dropbox-trigger',
        },
        animation : false,
        activeClass : 'active',
        isClicked : false,
    };

    /**
     * 이벤트 등록
     * @param {*} ins 
     */
    function _setEvent(ins){
        ueye.setDocClick(null, _clickOutHandler, ins);
    }
    /**
     * 클릭 핸들러
     * @param {*} event 
     * @param {*} ins 
     */
    function _clickOutHandler(event, ins) {
        var btn = event.target.closest('[' + ins.options.attr.button + ']');
        if (btn) {
            event.preventDefault();
            ins.isClicked = true;
            var exceptId = btn.getAttribute(ins.options.attr.button);
            _handleDropbox.call(btn, ins);
            _foldAll(ins, exceptId);
        } else if (ins.isClicked) {
            if (!event.target.closest('[' + ins.options.attr.box + ']')) {
                _foldAll(ins);
                ins.isClicked = false;
            }
        }
    }
    /**
     * 드롭박스 컨트롤
     * @param {*} ins 
     */
    function _handleDropbox(ins) {
        var options = ins.options;
        var attr = options.attr;

        var el = (typeof $ !== 'undefined' && this instanceof $) ? this[0] : this;
        var id = el.getAttribute(attr.button);
        var btn = document.querySelector('[' + attr.button + '="' + id + '"]');
        var wrap = btn.closest('[' + attr.wrap + '="' + id + '"]');
        var box = wrap ? wrap.querySelector('[' + attr.box + '="' + id + '"]') : document.querySelector('[' + attr.box + '="' + id + '"]');

        if (box.classList.contains(options.activeClass)) {
            btn.setAttribute('title', '펼치기');
            btn.setAttribute('aria-expanded', false);
            btn.classList.remove(options.activeClass);
            box.setAttribute('aria-hidden', true);
            box.classList.remove(options.activeClass);
            if (options.animation) core.animation.slideUp(box);
        } else {
            btn.setAttribute('title', '접기');
            btn.setAttribute('aria-expanded', true);
            btn.classList.add(options.activeClass);
            box.setAttribute('aria-hidden', false);
            box.classList.add(options.activeClass);
            if (options.animation) core.animation.slideDown(box);
        }
    }

    /**
     * 드롭박스 전체 닫기
     * @param {*} ins 
     * @param {*} exceptId 
     */
    function _foldAll(ins, exceptId) {
        var options = ins.options;
        var attr = options.attr;
        var btnSelector = exceptId === undefined
            ? '[' + attr.button + ']'
            : '[' + attr.button + ']:not([' + attr.button + '="' + exceptId + '"])';
        var boxSelector = exceptId === undefined
            ? '[' + attr.box + ']'
            : '[' + attr.box + ']:not([' + attr.box + '="' + exceptId + '"])';

        var btns = document.querySelectorAll(btnSelector);
        var boxes = document.querySelectorAll(boxSelector);

        btns.forEach(function(el) {
            el.setAttribute('title', '펼치기');
            el.classList.remove(options.activeClass);
        });
        boxes.forEach(function(el) {
            if (el.classList.contains(options.activeClass)) {
                el.setAttribute('aria-hidden', true);
                el.classList.remove(options.activeClass);
                if (options.animation) core.animation.slideUp(el);
            }
        });
    }

    /**
     * 접근성 처리
     * @param {*} ins 
     */
    function _setAccess(ins) {
        var options = ins.options;
        var attr = options.attr;
        var btns = document.querySelectorAll('[' + attr.button + ']');
        var boxes = document.querySelectorAll('[' + attr.box + ']');
        btns.forEach(function(el) {
            if (el.classList.contains(options.activeClass)) {
                el.setAttribute('title', '접기');
                el.setAttribute('aria-expanded', true);
            } else {
                el.setAttribute('title', '펼치기');
                el.setAttribute('aria-expanded', false);
            }
        });
        boxes.forEach(function(el) {
            if (el.classList.contains(options.activeClass)) {
                el.setAttribute('aria-hidden', false);
                if (options.animation && el.style.display !== 'block') el.style.display = 'block';
            } else {
                el.setAttribute('aria-hidden', true);
                if (options.animation && el.style.display !== 'none') el.style.display = 'none';
            }
        });
    }

    /**
     * loaded
     * @param {*} ins 
     */
    function _ready(ins){
        document.addEventListener("DOMContentLoaded", function(){
            _setEvent(ins);
            _setAccess(ins);
        });
    }

    /*-------------------------------------------------------------------
        @public > init
    -------------------------------------------------------------------*/
    dropbox.fn = dropbox.prototype = {
        constructor: dropbox,
        // 초기화
        init : function(options){
            this.options = ueye.deepCopyObject(defaultOptions); //옵션 카피
            if (options == null) {
                _ready(this);
                return this;
            }

            if (options.namespace == undefined) { //네임 커스텀
                if (options.attr) {
                    options.attr.wrap != undefined ? this.options.attr.wrap = options.attr.wrap : null;
                    options.attr.box != undefined ? this.options.attr.box = options.attr.box : null;
                    options.attr.button != undefined ? this.options.attr.button = options.attr.button : null;
                }
            } else { //공통 네임
                this.options.attr.wrap = 'data-'+ options.namespace +'-wrap';
                this.options.attr.box = 'data-'+ options.namespace;
                this.options.attr.button = 'data-'+ options.namespace +'-btn';
            }
            options.animation != undefined ? this.options.animation = options.animation : null;
            options.activeClass != undefined ? this.options.activeClass = options.activeClass : null;
            
            _ready(this);
            return this;
        },
        toggle : function (id, toggle){
            if (id === undefined || toggle === undefined) return false;
            var options = this.options;
            var attr = options.attr;
            var btn = document.querySelector('[' + attr.button + '="' + id + '"]');
            var box = document.querySelector('[' + attr.box + '="' + id + '"]');

            if (!btn || !box) return false;

            if (toggle) {
                this.isClicked = false;
                btn.setAttribute('title', '펼치기');
                btn.setAttribute('aria-expanded', false);
                box.classList.remove(options.activeClass);
                box.setAttribute('aria-hidden', true);
                if (options.animation) core.animation.slideUp(box);
            } else {
                this.isClicked = true;
                btn.setAttribute('title', '접기');
                btn.setAttribute('aria-expanded', true);
                box.classList.add(options.activeClass);
                box.setAttribute('aria-hidden', false);
                if (options.animation) core.animation.slideDown(box);
            }
            return this;
        },
    };
    dropbox.fn.init.prototype = dropbox.fn;

    return dropbox;
})();



/**
 * loading
 */
ueye.loading = (function(){
    const _private = {
        loading : null,
        isRenderd : false,
    }
    
    function _render(){
        const html = `
        <div class="loading-dialog">
            <div class="loader-1"><span></span></div>
            <strong>Loading</strong>
        </div>
        `
        document.querySelector('#wrap').insertAdjacentHTML('beforeend', html);
        _private.loading = document.querySelector('.loading-dialog');
    }
    function show(){
        if (!_private.isRenderd) {
            _private.isRenderd = true;
            _render();
        }
        _private.loading.classList.add('active');
    }
    function hide(){
        _private.loading.classList.remove('active');
    }

    return {
        show : show,
        hide : hide,
    }
})();



/**
 * Toast 컴포넌트
 * @description 사용자에게 알림 메시지를 표시하는 컴포넌트
 */
ueye.toast = (function(){
    const _private = {
        toasts : {},
        isRenderd : false,
        count : 0,
        container : null,
        toasts : {},
        name : {
            toast : 'toast_',
        }
    }
    
    function _init(){
        const html = `<div id="toastContainer" class="toast-container"></div>`;
        document.querySelector('#wrap').insertAdjacentHTML('beforeend', html);
        _private.container = document.querySelector('#toastContainer');
        _private.isRenderd = true;
    }
    function _render(status, type){
        const id = _private.name.toast + _private.count;
        const nowStatus = status || 'info'; // 기본값 설정
        let html = '';
        if (type && type === 'mini') {
            html = `
            <div class="toast mini" data-toast-id="${id}" data-status="${nowStatus}" role="alert" aria-live="assertive" aria-atomic="true">
                <strong class="title"></strong>
            </div>
            `;
            _private.container.insertAdjacentHTML('beforeend', html);
            _private.toasts[id] = {};
            _private.toasts[id].toast = document.querySelector(`.toast[data-toast-id="${id}"]`);
            _private.toasts[id].content = _private.toasts[id].toast.querySelector('.title');
        } else {
            html = `
            <div class="toast" data-toast-id="${id}" data-status="${nowStatus}" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="toast-head">
                    <strong class="title"></strong>
                    <small class="time"></small>
                    <button type="button" class="btn-close" aria-label="Close" onclick="ueye.toast.close('${id}')"></button>
                </div>
                <div class="toast-body"></div>
            </div>
            `;
            _private.container.insertAdjacentHTML('beforeend', html);
            _private.toasts[id] = {};
            _private.toasts[id].toast = document.querySelector(`.toast[data-toast-id="${id}"]`);
            _private.toasts[id].title = _private.toasts[id].toast.querySelector('.toast-head .title');
            _private.toasts[id].time = _private.toasts[id].toast.querySelector('.toast-head .time');
            _private.toasts[id].content = _private.toasts[id].toast.querySelector('.toast-body');
        }
        

        ++_private.count;
        return id;
    }
    /**
     * 토스트 메시지 실행
     * @param {Object} Object
     * @returns 
     */
    function action({title, time, message, status, type}){
        if (message == undefined) return false;
        if (_private.isRenderd == false) _init();
        const id = _render(status, type);

        if (_private.toasts[id].title) _private.toasts[id].title.innerText = title;
        if (time && _private.toasts[id].time) { //상대시간 설정
            const now = dayjs();
            const pastTime = dayjs(time);
            _private.toasts[id].time.innerText = pastTime.from(now);
        } else {
            delete _private.toasts[id].time;
        }
        if (_private.toasts[id].content) _private.toasts[id].content.innerText = message;
        _private.container.classList.add('active');
        _private.toasts[id].toast.classList.add('active');

        // 자동으로 닫기
        _private.toasts[id].timer = setTimeout(function(){
            close(id);
        }, 3000);

        // 마우스 호버시 자동 닫기 해제
        _private.toasts[id].enter = function(){
            clearTimeout(_private.toasts[id].timer);
            _private.toasts[id].timer = null;
        }
        _private.toasts[id].toast.addEventListener('mouseenter', _private.toasts[id].enter);
        // 마우스 아웃시 자동 닫기 재설정
        _private.toasts[id].leave = function(){
            if (_private.toasts[id].timer == null) {
                _private.toasts[id].timer = setTimeout(()=>{
                    close(id);
                }, 3000);
            }
        }
        _private.toasts[id].toast.addEventListener('mouseleave', _private.toasts[id].leave);
    }

    /**
     * 토스트 메시지 닫기 및 삭제
     * @param {String} id 
     * @returns 
     */
    function close(id){
        if (id == undefined || !_private.toasts[id]) return false;

        _private.toasts[id].toast.classList.remove('active');
        setTimeout(function(){
            _private.toasts[id].toast.removeEventListener('mouseenter', _private.toasts[id].enter);
            _private.toasts[id].toast.removeEventListener('mouseleave', _private.toasts[id].leave);
            
            _private.toasts[id].toast.remove();
            delete _private.toasts[id];
            if (Object.keys(_private.toasts).length < 1) _private.container.classList.remove('active');
        }, 500);
    }

    return {
        action : action,
        close : close,
    }
})();




ueye.draggable = (function(){
    const _private = {
        el : {
            draggable : null,
            target : null,
        },
        name : {
            draggable : '.ui-drag',
        },
        attr : {
            offsetX : 'data-pos-x',
            offsetY : 'data-pos-y',
        },
        isDrag : false,
        isDragTimer : null,
        offsetX : 0,
        offsetY : 0,
        rect : null,
        target : null,
    }

    function init(){
        _private.el.dragger = document.querySelectorAll(_private.name.draggable);
        document.addEventListener('pointerdown', _onPointerDown);
    }

    function _onPointerDown(e){
        const dragTarget = e.target.closest(_private.name.draggable);
        if (!dragTarget && !e.target.classList.contains('draggable')) return;
        _private.target = dragTarget;
        document.addEventListener('pointerup', _onPointerUP);
        
        if (_private.isDragTimer != null) {
            clearTimeout(_private.isDragTimer);
            _private.isDragTimer = null;
        }
        if (!_private.isDragTimer && _private.isDrag == false) {
            _private.isDragTimer = setTimeout(()=> {
                _private.isDrag = true;
                const rect = _private.target.getBoundingClientRect();
                const clientX = e.clientX || e.touches?.[0].clientX;
                const clientY = e.clientY || e.touches?.[0].clientY;
                _private.rect = rect;
                _private.offsetX = clientX - rect.left;
                _private.offsetY = clientY - rect.top;

                _private.target.style.transform = 'translate(0px, 0px)';
                _onPointerMove(e);

                document.addEventListener('pointermove', _onPointerMove);
            }, 100);
        }
    }
    function _onPointerMove(e){
        let w = _private.rect.width;
        let h = _private.rect.height;
        let viewportWidth = window.innerWidth;
        let viewportHeight = window.innerHeight;
        let clientX = e.clientX || e.touches?.[0].clientX;
        let clientY = e.clientY || e.touches?.[0].clientY;
        let x = clientX - _private.offsetX;
        let y = clientY - _private.offsetY;

        // 좌우 제한
        if (x < 0) x = 0;
        if (x + w > viewportWidth) x = viewportWidth - w;
        // 상하 제한
        if (y < 0) y = 0;
        if (y + h > viewportHeight) y = viewportHeight - h;

        _private.target.style.top = y + 'px';
        _private.target.style.left = x + 'px';
    //    _private.target.style.transform = `translate(${clientX - _private.startX}px, ${clientY - _private.startY}px)`;
    }
    function _onPointerUP(event){
        if (_private.isDragTimer != null) {
            clearTimeout(_private.isDragTimer);
            _private.isDragTimer = null;
        }
        if (!_private.isDrag) return;
        document.removeEventListener('pointermove', _onPointerMove);
        document.removeEventListener('pointerup', _onPointerUP);
        _private.isDrag = false;
    }

    return {
        init : init,
    }
})();



/**
 * 플로팅 박스
 * @return {instance} 인스턴스
 */
ueye.floating = (function(){
    const _private = {
        attr : {
            target : 'data-floating-target',
            trigger : 'data-floating-trigger',
            position : 'data-position',
        },
        activeClass : 'active',
        isOver : false,
        trigger : null,
    }

    /**
     * 이벤트 등록
     */
    function _setEvent(){
        document.addEventListener('mouseover', _onMouseover);
        document.addEventListener('mouseout', _onMouseout);
    }
    /**
     * 마우스 Over 핸들러
     * @param {*} event
     */
    function _onMouseover(event){
        if (_private.isOver) return;
        let trigger = event.target.closest('['+ _private.attr.trigger +']');
        let target = event.target.closest('['+ _private.attr.target +']');
        if (trigger) {
            _private.trigger = trigger;
            _private.isOver = true;
            // var exceptId = trigger.getAttribute(_private.attr.trigger);
            _handleFloatbox.call(trigger, event);
        } else if (target) {
            _private.isOver = true;
            trigger = _private.trigger;
            _handleFloatbox.call(trigger, event);
        }
    }
    /**
     * 마우스 Out 핸들러
     * @param {*} event
     */
    function _onMouseout(event){
        if (_private.isOver) {
            let trigger = event.target.closest('['+ _private.attr.trigger +']');
            let targetBox = event.target.closest('['+ _private.attr.target +']');

            if (!trigger || !targetBox) {
                _closeAll();
                _private.isOver = false;
            }
        }
    }
    /**
     * 드롭박스 컨트롤
     */
    function _handleFloatbox(event){
        let el = this;
        let id = el.getAttribute(_private.attr.trigger);
        let trigger = document.querySelector('['+ _private.attr.trigger +'="'+ id +'"]');
        let target = document.querySelector('['+ _private.attr.target +'="'+ id +'"]');
        let position = target.getAttribute(_private.attr.position);
        position = position == null ? "left" : position;

        target.style.top = "";
        target.style.bottom = "";
        let bound = el.getBoundingClientRect();
        let tW = target.offsetWidth;
        let tH = target.offsetHeight;
        let bt = bound.top;
        let bb = bound.bottom;
        let bl = bound.left;
        let br = ueye.win.width - bound.right;
        let dir = 'left';
        trigger.classList.add(_private.activeClass);
        trigger.setAttribute('title', '접기');
        target.classList.add(_private.activeClass);

        
        if (bb + tH > ueye.win.height) {
            if (bb > ueye.win.height - tH) {//겹침
                target.style.bottom = ueye.win.height - bt + "px";
            } else {
                target.style.bottom = "0px";
            }
        } else {
            target.style.top = bb +'px';
        }
        
        let move = '';
        if (position == "center") {
            bl = (bl + (bound.width / 2)) - (tW / 2);
            br = ueye.win.width - (bl + tW);
            move = bl;
            if (bl < 0) {
                move = 0;
            } else if (br < 0) {
                dir = 'right';
                move = 0;
            }
        } else if (position == "right") {
            dir = "right";
            bl = br + tW;
            move = br;
            if (bl > ueye.win.width) return target.style.left = '0px';
        } else {
            br = bl + tW;
            move = bl;
            if (br > ueye.win.width) return target.style.right = '0px';
        }

        target.style[dir] = move+'px';
        target.setAttribute('aria-hidden', false);
    }

    /**
     * 전체 닫기
     * @param {*} exceptId 
     */
    function _closeAll(exceptId){
        let trigger;
        let target;
        if (exceptId == undefined) {
            trigger = document.querySelectorAll('['+ _private.attr.trigger +']');
            target = document.querySelectorAll('['+ _private.attr.target +']');
        } else {
            trigger = document.querySelectorAll('['+ _private.attr.trigger +']:not(['+ _private.attr.trigger +'="'+ exceptId +'"]');
            target = document.querySelectorAll('['+ _private.attr.target +']:not(['+ _private.attr.target +'="'+ exceptId +'"]');
        }

        trigger.forEach((el)=>{
            el.setAttribute('title', '펼치기');
            el.classList.remove(_private.activeClass);
        });
        target.forEach((el)=>{
            if (el.classList.contains(_private.activeClass)) {
                el.setAttribute('aria-hidden', true);
                el.classList.remove(_private.activeClass);
            }
        });
    }

    /**
     * 초기화
     */
    function init(){
        _setEvent();
    }

    return {
        init : init,
    }
})();