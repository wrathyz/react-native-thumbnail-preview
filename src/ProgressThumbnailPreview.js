import React, {useEffect, useRef, useState} from 'react';
import {
  StyleSheet,
  View,
  PanResponder,
  Animated,
  StyleProp,
  ViewStyle,
  Easing,
  LayoutChangeEvent,
} from 'react-native';
import PreviewDuration from './PreviewDuration';
import {ThumbnailPreview, ThumbnailPreviewProps} from './ThumbnailPreview';

type ProgressThumbnailPreviewProps = {
  style?: StyleProp<ViewStyle>,
  /** duration in second */
  duration: number,
  /** currentTime in second */
  currentTime: number,
  /** show/hide progress bar */
  progressbarVisible?: boolean,
  /** default 20 */
  thumbSize?: number,
  /** default 50 */
  thumbTouchSize?: number,
  /** default 10 */
  trackHeight?: number,
  trackColor?: string,
  trackRadius?: number,
  trackFillColor?: string,
  thumbColor?: string,
  thumbTouchColor?: string,
  onSeekStart?: (timeSecond: number) => void,
  onSeekEnd?: (timeSecond: number) => void,
  thumbnailPreview: ThumbnailPreviewProps & {
    renderChild?: (e: {seekTime: number}) => React.ReactElement,
  },
};

const ProgressThumbnailPreview = (props: ProgressThumbnailPreviewProps) => {
  const trackHeight = props.trackHeight || 10;
  const thumbSize = props.thumbSize || 20;
  const thumbTouchSize = props.thumbTouchSize || 50;
  const thumbTouchArea = (thumbTouchSize - thumbSize) / 2;

  const [seekingTime, setseekingTime] = useState(0);
  const [widthTrackbar, setWidthTrackbar] = useState(0);
  const [widthTrackerbarContainer, setWidthTrackerbarContainer] = useState(0);
  const [widthContainer, setWidthContainer] = useState(0);
  const [holding, setHolding] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showProgressbar, setShowProgressbar] = useState(false);
  const refThumb = useRef(new Animated.Value(-thumbTouchArea));
  const refPreviewPos = useRef(new Animated.Value(-thumbTouchArea));
  const refPreviewOpacity = useRef(new Animated.Value(0));
  const refPanResponsder = useRef(PanResponder.create({}));
  const refProgressbarOpacity = useRef(new Animated.Value(0));

  useEffect(() => {
    if (!holding) {
      refThumb.current.setValue(
        _calcDurationToProgressPos(props.currentTime, props.duration) -
          thumbTouchArea -
          thumbSize / 2,
      );
    }
  }, [props.currentTime, props.duration, holding]);

  useEffect(() => {
    if (holding) _showPreview();
    else _hidePreview();
  }, [holding, showPreview]);

  useEffect(() => {
    if (!!props.progressbarVisible) _showProgressbar();
    else _hideProgressbar();
  }, [props.progressbarVisible]);

  useEffect(() => {
    refPanResponsder.current = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (_, gestureState) => {
        setHolding(true);
        setShowPreview(true);
        const {seekerPos, previewPos} = _calcSeekAndPreviewPos(
          gestureState.x0,
          gestureState.dx,
        );
        refThumb?.current?.setValue(seekerPos);
        if (typeof props?.thumbnailPreview?.baseMaxWidth === 'number') {
          refPreviewPos?.current?.setValue(
            previewPos <= 0
              ? 0
              : previewPos + props.thumbnailPreview.baseMaxWidth >=
                widthContainer
              ? widthContainer - props.thumbnailPreview.baseMaxWidth
              : previewPos,
          );
        }
        props?.onSeekStart?.(
          _calcDurationFromProgressPos(
            gestureState.x0 + gestureState.dx,
            props.duration,
          ),
        );
      },
      onPanResponderMove: (_, gestureState) => {
        const {touchPos, seekerPos, previewPos} = _calcSeekAndPreviewPos(
          gestureState.x0,
          gestureState.dx,
        );
        if (
          seekerPos > -thumbTouchArea &&
          seekerPos < widthTrackbar - thumbSize - thumbTouchArea
        ) {
          refThumb?.current?.setValue(seekerPos);
        }

        if (
          typeof props?.thumbnailPreview?.baseMaxWidth === 'number' &&
          touchPos - props.thumbnailPreview.baseMaxWidth / 2 >= 0 &&
          touchPos + props.thumbnailPreview.baseMaxWidth / 2 <= widthContainer
        ) {
          refPreviewPos?.current?.setValue(previewPos);
        }
        setseekingTime(_calcDurationFromProgressPos(touchPos, props.duration));
      },
      onPanResponderRelease: (_, gestureState) => {
        props?.onSeekEnd?.(
          _calcDurationFromProgressPos(
            gestureState.x0 + gestureState.dx,
            props.duration,
          ),
        );
        setHolding(false);
      },
      onPanResponderTerminate: () => {
        props?.onSeekEnd?.(props.currentTime);
        setHolding(false);
        setShowPreview(false);
      },
    });
  }, [
    props.duration,
    widthContainer,
    widthTrackbar,
    widthTrackerbarContainer,
    refThumb?.current,
    refPreviewPos?.current,
    thumbSize,
    thumbTouchSize,
  ]);

  const _calcDurationFromProgressPos = (touchPos: number, duration: number) => {
    const _seekingTime = ~~(
      (touchPos / (widthTrackbar - thumbSize / 2)) *
      duration
    );

    return Math.max(0, Math.min(_seekingTime, duration));
  };

  const _calcDurationToProgressPos = (
    currentTime: number,
    duration: number,
  ) => {
    return (currentTime / duration) * widthTrackbar;
  };

  const _calcSeekAndPreviewPos = (x: number, dx: number) => {
    const touchPos = x + dx;
    const seekerPos =
      touchPos -
      thumbTouchSize / 2 -
      thumbSize / 2 -
      (widthTrackerbarContainer - widthTrackbar);
    const previewPos =
      typeof props?.thumbnailPreview?.baseMaxWidth === 'number'
        ? seekerPos -
          props.thumbnailPreview.baseMaxWidth / 2 +
          thumbTouchSize / 2 +
          thumbSize / 2 +
          (widthTrackerbarContainer - widthTrackbar)
        : 0;

    return {
      touchPos,
      seekerPos,
      previewPos,
    };
  };

  const _showPreview = () => {
    Animated.timing(refPreviewOpacity.current, {
      toValue: 1,
      duration: 200,
      easing: Easing.quad,
      useNativeDriver: true,
    }).start(() => setShowPreview(true));
  };

  const _hidePreview = () => {
    Animated.timing(refPreviewOpacity.current, {
      toValue: 0,
      duration: 200,
      easing: Easing.quad,
      useNativeDriver: true,
    }).start(() => setShowPreview(false));
  };

  const _showProgressbar = () => {
    Animated.timing(refProgressbarOpacity.current, {
      toValue: 1,
      duration: 200,
      easing: Easing.quad,
      useNativeDriver: true,
    }).start(() => setShowProgressbar(true));
  };

  const _hideProgressbar = () => {
    Animated.timing(refProgressbarOpacity.current, {
      toValue: 0,
      duration: 200,
      easing: Easing.quad,
      useNativeDriver: true,
    }).start(() => setShowProgressbar(false));
  };

  const _onLayoutTrackbar = (e: LayoutChangeEvent) => {
    setWidthTrackbar(e.nativeEvent.layout.width);
  };

  const _onLayoutTrackbarContainer = (e: LayoutChangeEvent) => {
    setWidthTrackerbarContainer(e.nativeEvent.layout.width);
  };

  const _onLayoutContainer = (e: LayoutChangeEvent) => {
    setWidthContainer(e.nativeEvent.layout.width);
  };

  const _renderThumbnailPreview = (seekTime: number) => {
    const {baseMaxHeight, baseMaxWidth, vttUrl, baseUrl, renderChild} =
      props.thumbnailPreview;
    return (
      <ThumbnailPreview
        vttUrl={vttUrl}
        baseUrl={baseUrl}
        baseMaxWidth={baseMaxWidth}
        baseMaxHeight={baseMaxHeight}
        currentSecond={seekTime}>
        {typeof renderChild === 'function' ? (
          renderChild({seekTime})
        ) : (
          <PreviewDuration currentTimeSecond={seekTime} />
        )}
      </ThumbnailPreview>
    );
  };

  return (
    <Animated.View
      pointerEvents={showProgressbar ? 'auto' : 'none'}
      style={{
        opacity: refProgressbarOpacity.current,
      }}
      onLayout={_onLayoutContainer}>
      {!!props?.thumbnailPreview && showPreview && (
        <Animated.View
          pointerEvents="none"
          style={{
            opacity: refPreviewOpacity.current,
            transform: [
              {
                translateX: refPreviewPos.current,
              },
            ],
          }}>
          {_renderThumbnailPreview(seekingTime)}
        </Animated.View>
      )}
      <View
        style={StyleSheet.compose(props?.style || {}, {})}
        onLayout={_onLayoutTrackbarContainer}
        {...(refPanResponsder.current?.panHandlers || {})}>
        <View
          style={{
            width: '100%',
            overflow: 'hidden',
            flexDirection: 'row',
            borderRadius: (props.trackRadius || trackHeight) / 2,
            height: trackHeight,
            backgroundColor: props.trackColor || '#ddd',
            transform: [
              {
                translateY: thumbTouchSize / 2,
              },
            ],
          }}
          onLayout={_onLayoutTrackbar}>
          <Animated.View
            style={{
              height: '100%',
              flex: props.currentTime / props.duration,
              backgroundColor: props.trackFillColor || '#555',
            }}
          />
        </View>
        <Animated.View
          style={{
            backgroundColor: holding
              ? props.thumbTouchColor || '#ffffff7f'
              : 'transparent',
            width: thumbTouchSize,
            height: thumbTouchSize,
            borderRadius: thumbTouchSize / 2,
            justifyContent: 'center',
            alignItems: 'center',
            transform: [
              {
                translateX: refThumb.current,
              },
              {
                translateY: -trackHeight / 2,
              },
            ],
          }}>
          <View
            style={{
              width: thumbSize,
              height: thumbSize,
              borderRadius: thumbSize / 2,
              backgroundColor: props.thumbColor || '#ffffff',
            }}
          />
        </Animated.View>
      </View>
    </Animated.View>
  );
};

export {ProgressThumbnailPreview};
