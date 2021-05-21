import React, {useEffect, useRef, useState} from 'react';
import {SafeAreaView, StyleSheet, View, Dimensions} from 'react-native';
import RNFetchBlob from 'rn-fetch-blob';
import {
  ProgressThumbnailPreview,
  ThumbnailPreview,
  ThumbnailPreviewConfig,
} from 'react-native-thumbnail-preview';

const App = () => {
  const window = Dimensions.get('window');
  const duration = 52;
  const baseUrl =
    'https://stdlwcdn.lwcdn.com/i/8fdb4e20-8ebb-4590-8844-dae39680d837';
  const vttUrl =
    'https://stdlwcdn.lwcdn.com/i/8fdb4e20-8ebb-4590-8844-dae39680d837/160p.vtt';
  const [currentTime, setCurrentTime] = useState(0);

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

  return (
    <SafeAreaView style={styles.container}>
      <View
        style={{
          //video container
          width: '100%',
          height: (window.width * 9) / 16,
          justifyContent: 'flex-end',
          backgroundColor: '#000',
        }}>
        <ProgressThumbnailPreview
          style={{
            backgroundColor: '#eeeeeeaf',
            justifyContent: 'center',
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
          baseMaxWidthThumbnailPreview={160}
          duration={duration}
          currentTime={currentTime}
          onSeekStart={() => {
            console.log('onSeekStart');
          }}
          onSeekEnd={(time) => {
            console.log(time);
            setCurrentTime(time);
          }}
          thumbnailPreview={{
            vttUrl: vttUrl,
            baseUrl: baseUrl + '/',
            baseMaxWidth: 160,
          }}
        />
      </View>
    </SafeAreaView>
  );
};

const useInterval = (callback, delay) => {
  const savedCallback = useRef();

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    let id = setInterval(() => {
      savedCallback.current();
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
