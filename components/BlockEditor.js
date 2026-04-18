import { useEffect, useMemo, useRef, useState } from "react";

function createId(prefix = "block") {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function serializeBlocks(blocks) {
  return blocks
    .map((block) => {
      if (block.type === "text") return block.html || "<p></p>";
      if (block.type === "image") {
        return `<figure class="detail-inline-image detail-inline-image-${block.size}"><img src="${block.url}" alt="${block.alt || ""}" data-media-url="${block.url}" /></figure>`;
      }
      if (block.type === "video") {
        return `<div class="detail-clean-video"><div class="detail-clean-video-frame"><iframe src="${block.url}" title="Haber videosu" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div></div>`;
      }
      return "";
    })
    .join("");
}

function createInitialBlocks(value) {
  return [
    {
      id: createId("text"),
      type: "text",
      html: value || "<p></p>"
    }
  ];
}

export default function BlockEditor({ value, onChange, videoEmbedUrl }) {
  const [blocks, setBlocks] = useState(() => createInitialBlocks(value));
  const [activeTextId, setActiveTextId] = useState(() => createInitialBlocks(value)[0].id);
  const blockRefs = useRef({});

  useEffect(() => {
    onChange(serializeBlocks(blocks));
  }, [blocks, onChange]);

  const textBlockIds = useMemo(() => blocks.filter((block) => block.type === "text").map((block) => block.id), [blocks]);

  function setBlockRef(id, node) {
    if (!node) {
      delete blockRefs.current[id];
      return;
    }
    blockRefs.current[id] = node;
  }

  function focusTextBlock(id) {
    const node = blockRefs.current[id];
    if (!node) return;
    node.focus();
    setActiveTextId(id);
  }

  function syncTextBlock(id) {
    const node = blockRefs.current[id];
    if (!node) return;

    setBlocks((current) => current.map((block) => (block.id === id ? { ...block, html: node.innerHTML || "<p></p>" } : block)));
  }

  function applyCommand(command, valueArg = null) {
    const node = blockRefs.current[activeTextId];
    if (!node) return;
    node.focus();
    document.execCommand("styleWithCSS", false, true);
    document.execCommand(command, false, valueArg);
    syncTextBlock(activeTextId);
  }

  function insertTextBlockAfter(blockId) {
    const nextBlock = { id: createId("text"), type: "text", html: "<p></p>" };
    setBlocks((current) => {
      const index = current.findIndex((block) => block.id === blockId);
      const next = [...current];
      next.splice(index + 1, 0, nextBlock);
      return next;
    });
    window.requestAnimationFrame(() => focusTextBlock(nextBlock.id));
  }

  function insertVideoAfter(blockId) {
    if (!videoEmbedUrl) return;

    setBlocks((current) => {
      const index = current.findIndex((block) => block.id === blockId);
      const next = [...current];
      next.splice(index + 1, 0, { id: createId("video"), type: "video", url: videoEmbedUrl });
      next.splice(index + 2, 0, { id: createId("text"), type: "text", html: "<p></p>" });
      return next;
    });
  }

  function insertAssetAt(index, asset, size = "medium") {
    setBlocks((current) => {
      const next = [...current];
      if (asset.type === "image") {
        next.splice(index, 0, {
          id: createId("image"),
          type: "image",
          url: asset.url,
          previewUrl: asset.previewUrl || asset.url,
          alt: asset.originalFilename,
          size
        });
      } else {
        const activeId = activeTextId || textBlockIds[0];
        const activeNode = blockRefs.current[activeId];
        if (activeNode) {
          activeNode.focus();
          document.execCommand(
            "insertHTML",
            false,
            `<a href="${asset.url}" target="_blank" rel="noopener noreferrer">${asset.originalFilename}</a>&nbsp;`
          );
          syncTextBlock(activeId);
        }
      }

      if (!next[index + 1] || next[index + 1].type !== "text") {
        next.splice(index + 1, 0, { id: createId("text"), type: "text", html: "<p></p>" });
      }

      return next;
    });
  }

  function moveBlock(blockId, targetIndex) {
    setBlocks((current) => {
      const fromIndex = current.findIndex((block) => block.id === blockId);
      if (fromIndex === -1) return current;
      const next = [...current];
      const [dragged] = next.splice(fromIndex, 1);
      const adjusted = fromIndex < targetIndex ? targetIndex - 1 : targetIndex;
      next.splice(adjusted, 0, dragged);
      return next;
    });
  }

  function handleDrop(event, targetIndex) {
    event.preventDefault();
    const assetPayload = event.dataTransfer.getData("application/x-admin-asset");
    const blockPayload = event.dataTransfer.getData("application/x-editor-block");

    if (blockPayload) {
      moveBlock(blockPayload, targetIndex);
      return;
    }

    if (!assetPayload) return;
    insertAssetAt(targetIndex, JSON.parse(assetPayload));
  }

  return (
    <div className="block-editor-shell">
      <div className="content-toolbar content-toolbar-pro content-toolbar-rich">
        <div className="content-toolbar-group">
          <button type="button" className="toolbar-button" onMouseDown={(event) => event.preventDefault()} onClick={() => applyCommand("bold")}>
            B
          </button>
          <button type="button" className="toolbar-button" onMouseDown={(event) => event.preventDefault()} onClick={() => applyCommand("italic")}>
            I
          </button>
          <button type="button" className="toolbar-button" onMouseDown={(event) => event.preventDefault()} onClick={() => applyCommand("formatBlock", "h3")}>
            Ara Başlık
          </button>
          <button type="button" className="toolbar-button" onMouseDown={(event) => event.preventDefault()} onClick={() => applyCommand("fontName", "Times New Roman")}>
            Times
          </button>
        </div>
      </div>

      <div className="news-editor-blocks">
        {blocks.map((block, index) => (
          <div key={block.id} className="news-editor-dropzone" onDragOver={(event) => event.preventDefault()} onDrop={(event) => handleDrop(event, index)}>
            {block.type === "text" ? (
              <div className="news-editor-text-block-wrap">
                <div
                  ref={(node) => setBlockRef(block.id, node)}
                  className="news-editor-text-block"
                  contentEditable
                  suppressContentEditableWarning
                  dangerouslySetInnerHTML={{ __html: block.html }}
                  onFocus={() => setActiveTextId(block.id)}
                  onInput={() => syncTextBlock(block.id)}
                />
                <div className="news-editor-inline-actions">
                  <button type="button" className="button button-outline" onClick={() => insertTextBlockAfter(block.id)}>
                    Altına Metin
                  </button>
                  <button type="button" className="button button-outline" onClick={() => insertVideoAfter(block.id)}>
                    Video
                  </button>
                </div>
              </div>
            ) : null}
            {block.type === "image" ? (
              <div className={`editor-media-block editor-media-block-${block.size}`} draggable onDragStart={(event) => event.dataTransfer.setData("application/x-editor-block", block.id)}>
                <img src={block.previewUrl || block.url} alt={block.alt} />
              </div>
            ) : null}
            {block.type === "video" ? (
              <div className="editor-media-block editor-media-block-large" draggable onDragStart={(event) => event.dataTransfer.setData("application/x-editor-block", block.id)}>
                <div className="detail-clean-video">
                  <div className="detail-clean-video-frame">
                    <iframe
                      src={block.url}
                      title="Haber videosu"
                      loading="lazy"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        ))}

        <div className="news-editor-dropzone news-editor-dropzone-tail" onDragOver={(event) => event.preventDefault()} onDrop={(event) => handleDrop(event, blocks.length)}>
          <span>Görseli veya dosyayı buraya bırak</span>
        </div>
      </div>
    </div>
  );
}
