import ImageSize from 'react-native-image-size';
import {Cache} from './Cache';
import {Vtt} from './Vtt';

const ThumbnailPreviewConfig = {
  initCacheImage: (rnFetchBlob: any) => {
    Cache.initRNFetchBlob(rnFetchBlob);
  },
  preFetchVttImage: async (vttUrl: string, baseUrl?: string) => {
    let vttRes = Cache.getVtt(vttUrl);
    if (!vttRes?.length) {
      vttRes = await Vtt.fetchVttData(vttUrl);
      if (!!vttRes?.length) {
        Cache.storeVtt(vttUrl, vttRes);
      }
    }

    const imageUrls: string[] = [];
    vttRes?.forEach((v) => {
      const content = v.content.split('#xywh=');
      if (!imageUrls.includes(baseUrl + content[0])) {
        imageUrls.push(baseUrl + content[0]);
      }
    });

    if (imageUrls.length === 0) return false;

    const imageRes = await Promise.all(
      imageUrls.map((v) => ImageSize.getSize(v)),
    );

    imageRes?.forEach((v, i) => {
      Cache.storeImage(imageUrls[i], v.width, v.height);
    });

    return true;
  },
  removeCacheImage: () => {
    Cache.clearImage();
  },
};

export {ThumbnailPreviewConfig};
