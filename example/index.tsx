import React, {useEffect, useRef, useState} from 'react';
import {
  Dimensions,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  ProgressThumbnailPreview,
  ThumbnailPreviewConfig,
} from 'react-native-thumbnail-preview';
import RNFetchBlob from 'rn-fetch-blob';

const App = () => {
  const window = Dimensions.get('window');
  const duration = 52;
  const baseUrl =
    'https://stdlwcdn.lwcdn.com/i/8fdb4e20-8ebb-4590-8844-dae39680d837';
  const vttUrl =
    'https://stdlwcdn.lwcdn.com/i/8fdb4e20-8ebb-4590-8844-dae39680d837/160p.vtt';
  const [currentTime, setCurrentTime] = useState(0);
  const [control, setControl] = useState(false);
  const timeCtrl = useRef<any>();

  // for simulate video player is playing
  useInterval(() => {
    setCurrentTime((currentTime + 1) % duration);
  }, 1000);

  useEffect(() => {
    // optional: (reccommend) setup RNFetchBlob for caching image
    ThumbnailPreviewConfig.initCacheImage(RNFetchBlob);
    // caching image before display when seek (require RNFetchBlob)
    ThumbnailPreviewConfig.preFetchVttImage(vttUrl, baseUrl + '/');
    return () => {
      // clear cache image
      ThumbnailPreviewConfig.removeCacheImage();
    };
  }, []);

  const toggleControl = (visible: boolean) => {
    clearTimeout(timeCtrl.current);
    if (visible) {
      setControl(false);
    } else {
      setControl(true);
      timeCtrl.current = setTimeout(() => setControl(false), 2000);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View
        style={{
          //video container
          width: '80%',
          height: (window.width * 0.8 * 9) / 16,
          backgroundColor: '#000',
        }}>
        <TouchableOpacity
          style={{flex: 1, justifyContent: 'flex-end'}}
          activeOpacity={1}
          onPress={() => toggleControl(control)}>
          <ProgressThumbnailPreview
            progressbarVisible={control}
            style={{
              backgroundColor: '#eeeeeeaf',
              borderRadius: 8,
              paddingHorizontal: 8,
              marginHorizontal: 8,
              marginBottom: 8,
            }}
            trackHeight={8}
            trackColor="#aa00333f"
            trackFillColor="#a03"
            thumbColor="#500"
            thumbTouchColor="#5500007f"
            thumbSize={10}
            thumbTouchSize={30}
            duration={duration}
            currentTime={currentTime}
            onSeekStart={() => {
              clearTimeout(timeCtrl.current);
              console.log('onSeekStart');
            }}
            onSeekEnd={time => {
              console.log(time);
              setCurrentTime(time);
              toggleControl(control);
            }}
            thumbnailPreview={{
              vttUrl: vttUrl,
              baseUrl: baseUrl + '/',
              baseMaxWidth: 160,
            }}
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const useInterval = (callback: () => void, delay: number) => {
  const savedCallback = useRef<() => void>();

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    let id = setInterval(() => {
      savedCallback.current?.();
    }, delay);
    return () => clearInterval(id);
  }, [delay]);
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
});

export default App;
