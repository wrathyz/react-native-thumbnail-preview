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

    const size = Vtt.getImageSize(vttRes);
    if (!size) return false;

    const imageUrls: string[] = [];
    vttRes?.forEach(v => {
      const content = v.content.split('#xywh=');
      if (!imageUrls.includes(baseUrl + content[0])) {
        imageUrls.push(baseUrl + content[0]);
      }
    });

    if (imageUrls.length === 0) return false;

    imageUrls?.forEach((v, i) => {
      Cache.storeImage(imageUrls[i], size.width, size.height);
    });

    return true;
  },
  removeCacheImage: () => {
    Cache.clearImage();
  },
};

export {ThumbnailPreviewConfig};
