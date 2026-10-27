const dimensions: Record<string, [number, number]> = {
  "aws-arch": [1598, 1237], "aws-found": [1598, 1237], "be-ready": [1600, 1133],
  "build-ai": [1600, 900], "cisco-english": [1600, 1084], "depi-achievement": [1600, 900],
  "depi-appreciation": [1600, 1108], "depi-english": [1600, 1131], "helsinki-ai": [1120, 1600],
  "iti-php": [1131, 1596], "mckinsey": [1600, 1237], "nti-cloud": [1599, 1223],
  "nti-php": [1599, 1223], "packt-flutter": [1596, 1233], "sprintup": [1600, 1131],
  "devsync": [1400, 788], "flutter-specialization": [1210, 935], "lifi": [1322, 955],
  "resume-template": [1275, 1023], "weatherlink": [1400, 933],
};

export function responsiveImage(original: string) {
  const id = original.split("/").pop()?.replace(/\.webp$/, "") ?? "";
  const [width, height] = dimensions[id] ?? [640, 360];
  const cardWidth = Math.min(width, 640);
  const card = original.replace(/\.webp$/, "-card.webp");
  return {
    src: card,
    srcSet: `${card} ${cardWidth}w, ${original} ${width}w`,
    width,
    height,
  };
}
