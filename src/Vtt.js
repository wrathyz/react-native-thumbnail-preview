export type VttType = {
  id: string,
  start: number,
  end: number,
  content: string,
};

const Vtt = {
  fetchVttData: (urlFile: string): Promise<VttType[]> => {
    return new Promise((resolve, reject) => {
      fetch(urlFile)
        .then((res) => res.text())
        .then((res) => {
          let json = Vtt.vttStrToVttObj(res);
          if (!!json) resolve(json);
          else reject();
        })
        .catch(reject);
    });
  },
  timeStrToSecondNum: (time: string): number => {
    // except only format 00:00:00.000
    let secondTotal = 0;
    try {
      const h = Number(time.split(':')[0]);
      const m = Number(time.split(':')[1]);
      const s = Number(time.split(':')[2].split('.')[0]);
      if (h > 0) secondTotal = h * 3600;
      if (m > 0) secondTotal += m * 60;
      if (s >= 0) secondTotal += s;
    } catch (e) {
      secondTotal = -1;
    }

    return secondTotal;
  },
  vttStrToVttObj: (rawText: string): VttType[] => {
    /**
     * accept only format
     * ---------------------------------------
     * WEBVTT
     *
     * 1
     * 00:00:00.000 --> 00:00:01.000
     * content
     *
     * 2
     * 00:00:01.000 --> 00:00:02.000
     * content
     * ---------------------------------------
     */
    try {
      let linesArr = [];
      linesArr = rawText
        .split('\n')
        .map((v) => v.trim()) // remove space each of line
        .filter((v) => !!v); // filter not space

      // remove header 'WEBVTT'
      if (linesArr[0] == 'WEBVTT') linesArr.shift();

      let data: VttType[] = [];
      let lineIndex = 0;

      while (lineIndex < linesArr.length) {
        const spliterTime = ' --> ';
        const id = linesArr[lineIndex];
        const start = Vtt.timeStrToSecondNum(
          linesArr[lineIndex + 1].split(spliterTime)[0],
        );
        const end = Vtt.timeStrToSecondNum(
          linesArr[lineIndex + 1].split(spliterTime)[1],
        );
        const content = linesArr[lineIndex + 2];

        if (start < 0 || end < 0) throw 'cannot convert start time or end time';

        data.push({
          id,
          start,
          end,
          content,
        });
        lineIndex += 3;
      }

      return data;
    } catch (e) {
      return [];
    }
  },
  getResourcePreview: (currentTime: number, previewData: VttType[]) => {
    try {
      const xyConvert = (v: VttType) => {
        const imageAndPosition: string[] = v.content.split('#xywh=');
        const xywh: number[] = imageAndPosition[1]
          .split(',')
          .map((v) => Number(v));
        const width = xywh[2];
        const height = xywh[3];
        const x = ~~(xywh[0] / width);
        const y = ~~(xywh[1] / height);
        return {x, y};
      };

      for (let v of previewData) {
        if (~~currentTime >= v.start && ~~currentTime < v.end) {
          return {
            source: {uri: v.content},
            tiledDisplay: xyConvert(v),
          };
        }
      }

      if (currentTime === previewData?.length - 1) {
        return {
          source: {uri: previewData[currentTime].content},
          tiledDisplay: xyConvert(previewData[currentTime]),
        };
      }
    } catch {}

    return null;
  },
};

export {Vtt};
