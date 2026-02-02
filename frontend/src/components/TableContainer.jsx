import React from 'react';
import './tableContainer.css';

export default function TableContainer({ children, minWidth = 320, tableClassName = '', tableStyle = {} }) {
  const mergedStyle = { minWidth, width: '100%', ...tableStyle };
  return (
    <div className="table-container">
      <div className="table-scroll">
        <table className={tableClassName} style={mergedStyle}>
          {children}
        </table>
      </div>
    </div>
  );
}
