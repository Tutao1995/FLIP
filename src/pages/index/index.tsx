import React, { useState, useRef, useEffect } from 'react';
import './index.css';

const FLIP_STATE = {
    FIRST: Symbol('FIRST'),
    LAST: Symbol('LAST'),
    INVERT: Symbol('INVERT'),
    PLAY: Symbol('PLAY')
}

const VISIBLE_STATE = {
    INIT: Symbol('INIT'),
    PREVIEW: Symbol('PREVIEW'),
    CLOSING: Symbol('CLOSING')
}

function generateData(size: number) {
    function getSize() {
        return Math.round(Math.random() * 700 + 200)
    }

    function color16() {
        return ((Math.random() * 0x1000000) << 0).toString(16)
    }

    return Array(size).fill(0).map(() => {
        const width = getSize();
        const height = getSize();
        return {
            width,
            height,
            src: `http://dummyimage.com/${width}x${height}/${color16()}`
        }
    })
}


const pictures = generateData(10);
console.log(pictures)

export default function Index() {
    const [flipState, setFlipState] = useState(FLIP_STATE.FIRST);
    const [visibleState, setVisibleState] = useState(VISIBLE_STATE.INIT);
    const previewRef = useRef<HTMLImageElement>(null);
    const thumbnailRef = useRef<DOMRect>();
    const scaleValue = useRef(1);
    const elementPosition = useRef({
        [FLIP_STATE.FIRST]: [0, 0],
        [FLIP_STATE.LAST]: [0, 0]
    })

    const previewedThumbnailInfo = useRef({
        width: '0',
        src: null || ''
    });
    const previewLoading = useRef(false);
    const translateOffset = useRef<number[]>([0, 0]);
    useEffect(() => {
        function pictureLoaded(e: Event) {
            // @ts-ignore
            console.log(this, 'this')
            previewLoading.current = false;
            const previewPictureRect = previewRef.current!.getBoundingClientRect();
            elementPosition.current[FLIP_STATE.LAST] = [previewPictureRect.left, previewPictureRect.top];
            scaleValue.current = thumbnailRef.current!.width / (previewedThumbnailInfo.current.width as unknown as number);
            setFlipState(FLIP_STATE.INVERT);
        }
        if (flipState === FLIP_STATE.LAST && visibleState === VISIBLE_STATE.PREVIEW) {
            previewLoading.current = true;
            setTimeout(() => {
                previewLoading.current = false
            }, 5000)
            previewRef.current?.addEventListener('load', pictureLoaded)
        } else if (flipState === FLIP_STATE.INVERT) {
            setTimeout(() => {
                setFlipState(FLIP_STATE.PLAY)
            }, 5);
        }
    }, [flipState, visibleState])

    function handlePreviewPicture(e: React.MouseEvent<HTMLUListElement, MouseEvent>) {
        if ((e !== null && e.target instanceof HTMLElement)) {
            const target = e.target as HTMLElement;
            if (target.tagName === 'LI') {
                const thumbnailRect = target?.getBoundingClientRect();
                thumbnailRef.current = thumbnailRect;
                elementPosition.current[FLIP_STATE.FIRST] = [thumbnailRect.left, thumbnailRect.top];
                const { imageWidth: width, imageSrc: src } = e.target.dataset;
                if (width !== undefined && src !== undefined) {
                    previewedThumbnailInfo.current = { width, src };
                    setFlipState(FLIP_STATE.LAST)
                    setVisibleState(VISIBLE_STATE.PREVIEW)
                }
            }
        }
    }

    function handleClosePreview() {
        console.log(previewLoading.current, "previewLoading.current ")
        if (previewLoading.current) return
        setVisibleState(VISIBLE_STATE.CLOSING)
        setFlipState(FLIP_STATE.INVERT)
    }

    function handleTransitionEnd() {
        if (visibleState === VISIBLE_STATE.CLOSING) {
            setVisibleState(VISIBLE_STATE.INIT);
            setFlipState(FLIP_STATE.FIRST);
            translateOffset.current = [0, 0]
        }
    }


    const enableTransition =
        (flipState === FLIP_STATE.PLAY && visibleState === VISIBLE_STATE.PREVIEW) ||
        visibleState === VISIBLE_STATE.CLOSING

    const previewVisible = flipState === FLIP_STATE.PLAY

    const showPreview =
        visibleState === VISIBLE_STATE.PREVIEW ||
        visibleState === VISIBLE_STATE.CLOSING

    if (flipState === FLIP_STATE.INVERT && !translateOffset.current[0] && !translateOffset.current[1]) {
        const {
            [FLIP_STATE.FIRST]: firstState,
            [FLIP_STATE.LAST]: lastState,
        } = elementPosition.current
        const [firstX, firstY] = firstState
        const [lastX, lastY] = lastState
        translateOffset.current = [firstX - lastX, firstY - lastY]
    }

    const transformStyle = flipState === FLIP_STATE.INVERT || visibleState === VISIBLE_STATE.CLOSING ?
        `translate3d(${translateOffset.current[0]}px, ${translateOffset.current[1]}px, 0) scale(${scaleValue.current})` :
        `translate3d(0, 0, 0) scale(1)`
    const log = {
        flipState,
        visibleState,
        scaleValue: scaleValue.current,
        enableTransition,
        showPreview,
        transformStyle,
        showMask: previewVisible,
        translateOffset: translateOffset.current,
    }
    console.log(log)

    return (
        <>
            <ul className="pic-list" onClick={(e: React.MouseEvent<HTMLUListElement, MouseEvent>) => handlePreviewPicture(e)}>
                {pictures.map((item, index) => (
                    <li
                        key={index}
                        data-image-width={item.width}
                        data-image-src={item.src}
                        className="pic-item"
                        title="点击预览"
                    >
                        <img src={item.src} alt="" className="pic" />
                    </li>
                ))}
            </ul>
            {showPreview && (
                <div
                    className="preview-box"
                    onClick={handleClosePreview}
                    style={{
                        opacity: previewVisible ? 1 : 0,
                    }}
                >
                    {/* 原始尺寸图片预览 */}
                    <img
                        ref={previewRef}
                        className={`img${enableTransition ? ' active' : ''}`}
                        src={previewedThumbnailInfo.current.src}
                        style={{
                            transform: transformStyle,
                            // 相对于 viewport 左上角缩放
                            transformOrigin: '0 0',
                        }}
                        onClick={handleClosePreview}
                        onTransitionEnd={handleTransitionEnd}
                        alt=""
                    />
                </div>
            )}
        </>
    )
}