import React, {ReactNode, useEffect, useState} from 'react';
import {View} from 'react-native';
import {Cache} from './Cache';
import {Vtt, VttType} from './Vtt';
import {RectImage} from './RectImage';

export type ThumbnailPreviewProps = {
  /** url vtt of video */
  vttUrl: string;
  /** currentTime to display thumbnail */
  currentSecond: number;
  /**
   * if url image in vtt file has only path like this "1.png",
   * you can set baseUrl here, it will be baseUrl + "1.png"
   * */
  baseUrl?: string;
  baseMaxWidth?: number;
  baseMaxHeight?: number;
};

const ThumbnailPreview = (
  props: ThumbnailPreviewProps & {children?: ReactNode},
) => {
  const [vttData, setVttData] = useState<VttType[]>([]);
  const [imgWidth, setImgWidth] = useState<number>(0);
  const [imgheight, setImgHeight] = useState<number>(0);

  useEffect(() => {
    const res = Cache.getVtt(props.vttUrl);
    if (!!res?.length) {
      setVttData(res);

      const size = Vtt.getImageSize(res);
      if (size) {
        setImgWidth(size.width);
        setImgHeight(size.height);
      }
    } else {
      Vtt.fetchVttData(props.vttUrl).then(res => {
        if (!!res?.length) {
          setVttData(res);
          Cache.storeVtt(props.vttUrl, res);

          const size = Vtt.getImageSize(res);
          if (size) {
            setImgWidth(size.width);
            setImgHeight(size.height);
          }
        }
      });
    }
  }, [props.vttUrl]);

  const resource = Vtt.getResourcePreview(props?.currentSecond, vttData);
  const url = !!props?.baseUrl
    ? props?.baseUrl + resource?.source?.uri
    : resource?.source?.uri;

  return !!vttData?.length && !!resource && typeof url === 'string' ? (
    <RectImage
      source={{uri: url}}
      tiledDisplay={resource.tiledDisplay}
      baseMaxWidth={props?.baseMaxWidth}
      baseMaxHeight={props?.baseMaxHeight}
      imageWidth={imgWidth}
      imageHeight={imgheight}>
      {props.children}
    </RectImage>
  ) : (
    <View />
  );
};

export {ThumbnailPreview};
