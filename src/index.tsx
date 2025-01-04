import { ComponentChildren, FunctionComponent } from "preact";
import { useEffect, useRef, useState } from "preact/hooks";
import register from "preact-custom-element";

const cssURL =
  //"index.css";
  "https://cdn.jsdelivr.net/npm/searchable-image@1.0.3/docs/index.css";

const obserableAttributes = [
  "alt",
  "crossorigin",
  "decoding",
  "height",
  "loading",
  "referrerpolicy",
  "sizes",
  "src",
  "srcset",
  "style",
  "usemap",
  "width",
] as const;

const SearchableImage: FunctionComponent<
  {
    texts: ComponentChildren;
  } & Record<(typeof obserableAttributes)[number], string | undefined>
> = ({
  texts,
  alt,
  crossorigin,
  decoding,
  height,
  loading,
  referrerpolicy,
  sizes,
  src,
  srcset,
  style,
  usemap,
  width,
}) => {
  const [imageBitmap, setImageBitmap] = useState<ImageBitmap>();

  const image = useRef<HTMLImageElement>(null);
  const textLayer = useRef<HTMLDivElement>(null);
  const textsContainer = useRef<HTMLDivElement>(null);

  const attributes = {
    alt,
    crossorigin,
    decoding,
    height,
    loading,
    referrerpolicy,
    sizes,
    src,
    srcset,
    style,
    usemap,
    width,
  };
  useEffect(() => {
    if (!image.current) {
      return;
    }
    const currentImage = image.current;

    const abortController = new AbortController();
    (async () => {
      for (const [qualifiedName, value] of Object.entries(attributes)) {
        if (typeof value === "string") {
          currentImage.setAttribute(qualifiedName, value);
        } else {
          currentImage.removeAttribute(qualifiedName);
        }
      }

      if (!currentImage.complete) {
        await new Promise((resolve, reject) => {
          currentImage.onload = resolve;
          currentImage.onerror = reject;
        });
      }
      const imageBitmap = await createImageBitmap(currentImage);

      if (abortController.signal.aborted) {
        throw abortController.signal.reason;
      }
      setImageBitmap(imageBitmap);
    })();

    return () => {
      abortController.abort();
    };
  }, Object.values(attributes));

  useEffect(() => {
    if (
      !imageBitmap ||
      !image.current ||
      !textLayer.current ||
      !textsContainer.current
    ) {
      return;
    }
    const currentImage = image.current;
    const currentTextLayer = textLayer.current;
    const currentTextsContainer = textsContainer.current;

    const renderTexts = () => {
      currentTextLayer.replaceChildren();
      for (const searchableText of currentTextsContainer.querySelectorAll(
        "s-text"
      )) {
        const x =
          (Number(searchableText.getAttribute("x")) / imageBitmap.width) *
          currentTextLayer.clientWidth;
        const y =
          (Number(searchableText.getAttribute("y")) / imageBitmap.height) *
          currentTextLayer.clientHeight;
        const width =
          (Number(searchableText.getAttribute("width")) / imageBitmap.width) *
          currentTextLayer.clientWidth;
        const height =
          (Number(searchableText.getAttribute("height")) / imageBitmap.height) *
          currentTextLayer.clientHeight;

        const defaultFontSize = Math.min(width, height);
        const expected = Math.max(width, height);
        const textContent = searchableText.textContent ?? "";

        const text = document.createElement("span");
        text.classList.add("text");
        text.style.left = `${x}px`;
        text.style.top = `${y}px`;
        text.style.letterSpacing = "0";
        text.style.fontSize = `${defaultFontSize}px`;
        text.style.width = "";
        text.style.height = "";
        text.textContent = textContent;
        currentTextLayer.append(text);

        const rect = text.getBoundingClientRect();
        const actual = Math.max(rect.width, rect.height);
        text.style.letterSpacing = `${
          Math.max(expected - actual, 0) /
          [...new Intl.Segmenter().segment(textContent)].length
        }px`;
        text.style.fontSize = `${
          defaultFontSize * Math.min(expected / actual, 1)
        }px`;
        text.style.width = `${width}px`;
        text.style.height = `${height}px`;
      }
    };
    renderTexts();

    const resizeObserver = new ResizeObserver(() => {
      renderTexts();
    });
    resizeObserver.observe(currentImage);

    return () => {
      resizeObserver.disconnect();
    };
  }, [imageBitmap]);

  return (
    <>
      <link rel="stylesheet" href={cssURL} />

      <div translate={false} className="container">
        <img ref={image} className="image" />
        <div ref={textLayer} className="text-layer" />
        <div ref={textsContainer} hidden>
          {texts}
        </div>
      </div>
    </>
  );
};

register(SearchableImage, "s-img", [...obserableAttributes], { shadow: true });
