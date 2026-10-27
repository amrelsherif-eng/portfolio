import { useState } from "react";
import { MdArrowOutward } from "react-icons/md";
import { Link } from "react-router-dom";
import { responsiveImage } from "../utils/responsiveImage";

interface Props {
  image: string;
  alt?: string;
  video?: string;
  link?: string;
  priority?: boolean;
}

const WorkImage = (props: Props) => {
  const [isVideo, setIsVideo] = useState(false);
  const [video, setVideo] = useState("");
  const isExternalLink = Boolean(props.link && !props.link.startsWith("/"));

  const handleMouseEnter = async () => {
    if (props.video) {
      setIsVideo(true);
      const response = await fetch(`src/assets/${props.video}`);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      setVideo(blobUrl);
    }
  };

  return (
    <div className="work-image">
      {props.link ? (
        isExternalLink ? (
          <a
            className="work-image-in"
            href={props.link}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={() => setIsVideo(false)}
            target="_blank"
            rel="noopener noreferrer"
            data-cursor={"disable"}
          >
            <div className="work-link">
              <MdArrowOutward />
            </div>
            <img {...responsiveImage(props.image)} sizes="(max-width: 768px) 90vw, 420px" alt={props.alt} loading={props.priority ? "eager" : "lazy"} fetchPriority={props.priority ? "high" : "auto"} decoding="async" />
            {isVideo && <video src={video} autoPlay muted playsInline loop></video>}
          </a>
        ) : (
          <Link
            className="work-image-in"
            to={props.link}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={() => setIsVideo(false)}
            data-cursor={"disable"}
          >
            <div className="work-link">
              <MdArrowOutward />
            </div>
            <img {...responsiveImage(props.image)} sizes="(max-width: 768px) 90vw, 420px" alt={props.alt} loading={props.priority ? "eager" : "lazy"} fetchPriority={props.priority ? "high" : "auto"} decoding="async" />
            {isVideo && <video src={video} autoPlay muted playsInline loop></video>}
          </Link>
        )
      ) : (
        <div
          className="work-image-in"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={() => setIsVideo(false)}
          data-cursor={"disable"}
        >
          <img {...responsiveImage(props.image)} sizes="(max-width: 768px) 90vw, 420px" alt={props.alt} loading={props.priority ? "eager" : "lazy"} fetchPriority={props.priority ? "high" : "auto"} decoding="async" />
          {isVideo && <video src={video} autoPlay muted playsInline loop></video>}
        </div>
      )}
    </div>
  );
};

export default WorkImage;
