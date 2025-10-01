'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Copy, Check, FileText } from 'lucide-react';
import type { Source } from './types';

interface SourcesDrawerProps {
  sources: Source[];
}

export default function SourcesDrawer({ sources }: SourcesDrawerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopy = async (content: string, index: number) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (!sources || sources.length === 0) {
    return null;
  }

  const formatTableName = (tableName: string) => {
    return tableName
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getSimilarityColor = (similarity: number) => {
    if (similarity >= 0.8) return 'bg-green-500';
    if (similarity >= 0.6) return 'bg-yellow-500';
    return 'bg-orange-500';
  };

  return (
    <div className="mt-3 bg-slate-50 border border-slate-200 rounded-lg overflow-hidden">
      {/* Header - Clickable */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-slate-600" />
          <span className="text-sm font-medium text-slate-700">
            Sources ({sources.length})
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-slate-600" />
        ) : (
          <ChevronDown className="h-4 w-4 text-slate-600" />
        )}
      </button>

      {/* Expandable Content */}
      {isExpanded && (
        <div className="border-t border-slate-200 p-4 space-y-3">
          {sources.map((source, index) => (
            <div
              key={index}
              className="bg-white border border-slate-200 rounded-lg p-3 space-y-2"
            >
              {/* Source Header */}
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="text-sm font-semibold text-slate-900">
                    {formatTableName(source.table_name)}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-slate-500">Similarity:</span>
                    <div className="flex-1 max-w-[150px] h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${getSimilarityColor(source.similarity)} transition-all`}
                        style={{ width: `${source.similarity * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-slate-700">
                      {(source.similarity * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>

                {/* Copy Button */}
                <button
                  onClick={() => handleCopy(source.content, index)}
                  className="ml-3 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors"
                  title="Copy content"
                >
                  {copiedIndex === index ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>

              {/* Content Preview */}
              <div className="text-sm text-slate-600 leading-relaxed">
                {source.content.length > 300
                  ? `${source.content.substring(0, 300)}...`
                  : source.content}
              </div>

              {/* Metadata (if available) */}
              {source.metadata && Object.keys(source.metadata).length > 0 && (
                <div className="pt-2 border-t border-slate-100">
                  <details className="text-xs text-slate-500">
                    <summary className="cursor-pointer hover:text-slate-700">
                      View metadata
                    </summary>
                    <pre className="mt-2 p-2 bg-slate-50 rounded overflow-x-auto">
                      {JSON.stringify(source.metadata, null, 2)}
                    </pre>
                  </details>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
