import React, { useMemo, useRef, useEffect, useState } from 'react';
import { FixedSizeGrid } from 'react-window';

const VirtualizedGrid = ({
  items,
  renderItem,
  itemHeight = 160,
  gap = 16,
  onItemsRendered,
  lastItemRef,
}) => {
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0, columnCount: 1 });

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        const height = window.innerHeight - 300; // Account for header and padding

        let columnCount = 1;
        if (width >= 1280) columnCount = 4;
        else if (width >= 1024) columnCount = 3;
        else if (width >= 768) columnCount = 2;

        setDimensions({
          width,
          height: Math.max(height, 400),
          columnCount,
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const rowCount = Math.ceil(items.length / dimensions.columnCount);
  const columnWidth = dimensions.columnCount > 0 
    ? (dimensions.width - (dimensions.columnCount - 1) * gap) / dimensions.columnCount 
    : dimensions.width;

  const Cell = ({ columnIndex, rowIndex, style }) => {
    const index = rowIndex * dimensions.columnCount + columnIndex;
    if (index >= items.length) return null;

    const item = items[index];
    const isLastItem = index === items.length - 1;

    return (
      <div
        style={{
          ...style,
          paddingLeft: columnIndex === 0 ? 0 : gap / 2,
          paddingRight: columnIndex === dimensions.columnCount - 1 ? 0 : gap / 2,
          paddingTop: rowIndex === 0 ? 0 : gap / 2,
          paddingBottom: rowIndex === rowCount - 1 ? gap : gap / 2,
        }}
        ref={isLastItem ? lastItemRef : null}
      >
        {renderItem(item, index)}
      </div>
    );
  };

  if (dimensions.width === 0 || items.length === 0) {
    return <div ref={containerRef} className="w-full" style={{ minHeight: 400 }} />;
  }

  return (
    <div ref={containerRef} className="w-full">
      <FixedSizeGrid
        columnCount={dimensions.columnCount}
        columnWidth={columnWidth}
        height={dimensions.height}
        rowCount={rowCount}
        rowHeight={itemHeight + gap}
        width={dimensions.width}
        onItemsRendered={onItemsRendered}
        style={{ overflowX: 'hidden' }}
      >
        {Cell}
      </FixedSizeGrid>
    </div>
  );
};

export default VirtualizedGrid;

