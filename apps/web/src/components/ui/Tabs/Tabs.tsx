'use client';

import { useState, createContext, useContext } from 'react';
import { cn } from '@/lib/utils';
import { tabsClasses } from './Tabs.styles';

export interface Tab {
  key: string;
  label: string;
  icon?: React.ReactNode;
  count?: number;
}

interface TabsContextValue {
  activeKey: string;
  onChange: (key: string) => void;
}

const TabsContext = createContext<TabsContextValue>({
  activeKey: '',
  onChange: () => {},
});

export interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
  value?: string;
  onChange?: (key: string) => void;
  children: React.ReactNode;
  className?: string;
}

export function Tabs({ tabs, defaultTab, value, onChange, children, className }: TabsProps) {
  const [internalKey, setInternalKey] = useState(defaultTab || tabs[0]?.key || '');
  const activeKey = value !== undefined ? value : internalKey;

  const handleChange = (key: string) => {
    setInternalKey(key);
    onChange?.(key);
  };

  return (
    <TabsContext.Provider value={{ activeKey, onChange: handleChange }}>
      <div className={cn('space-y-4', className)}>
        <div className={tabsClasses.list}>
          {tabs.map((tab) => (
            <button
              key={tab.key}
              data-active={activeKey === tab.key}
              onClick={() => handleChange(tab.key)}
              className={tabsClasses.trigger}
            >
              <span className="flex items-center gap-2">
                {tab.icon}
                {tab.label}
                {tab.count !== undefined && (
                  <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-slate-200 text-slate-600">
                    {tab.count}
                  </span>
                )}
              </span>
            </button>
          ))}
        </div>
        <div>{children}</div>
      </div>
    </TabsContext.Provider>
  );
}

export function TabPanel({ tabKey, children }: { tabKey: string; children: React.ReactNode }) {
  const { activeKey } = useContext(TabsContext);
  if (activeKey !== tabKey) return null;
  return <div>{children}</div>;
}
