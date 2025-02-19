import { useState } from 'react';
import PDFList from '../PDFList/PDFList';
import App from '@/App';
import styles from './Main.module.scss';
import classNames from 'classnames/bind';

const cx = classNames.bind(styles);

interface PDFTab {
  id: string;
  title: string;
  documentId: string;
  url: string;
}

export default function Main() {
  const [openTabs, setOpenTabs] = useState<PDFTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [showList, setShowList] = useState(true);

  const activeDocumentId = openTabs.find(tab => tab.id === activeTabId)?.documentId ?? null;

  const handleViewPDF = (id: string, url: string, title: string) => {
    // Check if a tab with the given documentId already exists.
    // If so, reuse it by setting it as active, rather than creating a new tab.
    const existingTab = openTabs.find(tab => tab.documentId === id);
    if (existingTab) {
      setActiveTabId(existingTab.id);
    } else {
      const newTab: PDFTab = {
        id: crypto.randomUUID(),
        documentId: id,
        url,
        title,
      };
      setOpenTabs(prev => [...prev, newTab]);
      setActiveTabId(newTab.id);
    }
    setShowList(false);
  };

  const handleCloseTab = (e: React.MouseEvent, tabId: string) => {
    e.stopPropagation();
    const newTabs = openTabs.filter(tab => tab.id !== tabId);
    setOpenTabs(newTabs);

    if (activeTabId === tabId) {
      if (newTabs.length > 0) {
        // 닫은 탭이 활성 탭이었다면 마지막 탭을 활성화
        setActiveTabId(newTabs[newTabs.length - 1].id);
      } else {
        setActiveTabId(null);
        setShowList(true);
      }
    }
  };

  const handleBackToList = () => {
    // 단순히 목록 화면만 보여주기
    setShowList(true);
  };

  return (
    <div className={cx('container')}>
      <div className={cx('content', { 'with-viewer': !showList })}>
        <div className={cx('list-container', { hidden: !showList })}>
          <PDFList
            activePdfId={activeDocumentId}
            onView={handleViewPDF}
            setShowList={setShowList}
          />
        </div>

        {openTabs.length > 0 && (
          <div className={cx('viewer-container', { hidden: showList })}>
            <div className={cx('pdf-tabs')}>
              {openTabs.map(tab => (
                <div
                  key={tab.id}
                  className={cx('pdf-tab', { active: activeTabId === tab.id })}
                  onClick={() => {
                    setActiveTabId(tab.id);
                    setShowList(false);
                  }}
                >
                  <span className={cx('tab-title')}>{tab.title}</span>
                  <button className={cx('close-button')} onClick={e => handleCloseTab(e, tab.id)}>
                    ×
                  </button>
                </div>
              ))}
            </div>
            <div className={cx('pdf-viewer')}>
              {openTabs.map(tab => (
                <div key={tab.id} style={{ display: activeTabId === tab.id ? 'block' : 'none' }}>
                  <App documentId={tab.documentId} onBack={handleBackToList} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
