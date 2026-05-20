"use client";

import { colors } from '@/lib/design-system';

interface PipelineStageRowProps {
  stage: {
    id: string;
    label: string;
    status: 'idle' | 'running' | 'completed' | 'warning' | 'failed';
    startedAt?: Date;
    completedAt?: Date;
    badge?: string;
  };
  isActive: boolean;
  onClick: () => void;
  showConnector?: boolean;
}

export function PipelineStageRow({ stage, isActive, onClick, showConnector = true }: PipelineStageRowProps) {
  const getStatusIcon = () => {
    switch (stage.status) {
      case 'idle':
        return (
          <div 
            className="stage-icon-idle"
            style={{
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              border: '1.5px solid rgba(255,255,255,0.15)',
            }}
          />
        );
      case 'running':
        return (
          <div 
            className="stage-icon-spinning"
            style={{
              width: '18px',
              height: '18px',
              borderRadius: '50%',
              border: '2px solid rgba(29,158,117,0.25)',
              borderTopColor: colors.tealPrimary,
            }}
          />
        );
      case 'completed':
        return (
          <div 
            className="stage-icon-done"
            style={{
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              backgroundColor: colors.tealPrimary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '10px',
              fontWeight: 700,
            }}
          >
            ✓
          </div>
        );
      case 'warning':
        return (
          <div 
            className="stage-icon-warning"
            style={{
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              backgroundColor: colors.amber,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '12px',
              fontWeight: 700,
            }}
          >
            !
          </div>
        );
      case 'failed':
        return (
          <div 
            className="stage-icon-failed"
            style={{
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              backgroundColor: colors.red,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '10px',
              fontWeight: 700,
            }}
          >
            ✗
          </div>
        );
    }
  };

  const getBadgeStyle = () => {
    switch (stage.status) {
      case 'running':
        return {
          backgroundColor: `rgba(29,158,117,0.2)`,
          color: colors.tealPrimary,
          animation: 'badge-pulse 1.4s ease-in-out infinite',
        };
      case 'completed':
        return {
          backgroundColor: `rgba(29,158,117,0.2)`,
          color: colors.tealPrimary,
        };
      case 'warning':
        return {
          backgroundColor: `rgba(239,159,39,0.2)`,
          color: colors.amber,
        };
      case 'failed':
        return {
          backgroundColor: `rgba(226,75,74,0.2)`,
          color: colors.red,
        };
      default:
        return null;
    }
  };

  const getTimestamp = () => {
    if (!stage.completedAt) return null;
    return stage.completedAt.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  const getStageName = () => {
    if (stage.status === 'idle') {
      return 'rgba(240,244,255,0.25)';
    } else if (stage.status === 'completed') {
      return 'rgba(240,244,255,0.45)';
    } else {
      return colors.textPrimary;
    }
  };

  const badgeStyle = getBadgeStyle();

  return (
    <div className="relative">
      <button
        onClick={onClick}
        className={`w-full flex items-center text-left transition-all stage--${stage.status}`}
        style={{
          height: '52px',
          paddingLeft: stage.status === 'running' ? '18px' : '20px',
          paddingRight: '20px',
          backgroundColor:
            stage.status === 'running'
              ? 'rgba(29,158,117,0.10)'
              : isActive
                ? 'rgba(255,255,255,0.04)'
                : 'transparent',
          borderLeft: stage.status === 'running'
            ? `2px solid ${colors.tealPrimary}`
            : isActive
              ? '2px solid rgba(255,255,255,0.10)'
              : '2px solid transparent',
          cursor: 'pointer',
        }}
      >
        {/* Status Icon - 20px */}
        <div className="flex-shrink-0" style={{ width: '20px', display: 'flex', justifyContent: 'center' }}>
          {getStatusIcon()}
        </div>

        {/* 16px gap */}
        <div style={{ width: '16px' }} />

        {/* Stage Name */}
        <div 
          className="flex-1 text-sm"
          style={{ 
            color: getStageName(),
            fontWeight: stage.status === 'running' ? 500 : 400,
          }}
        >
          {stage.label}
        </div>

        {/* Badge pill */}
        {stage.badge && badgeStyle && (
          <>
            <div 
              className="px-2.5 py-1 rounded-[99px] text-xs font-mono"
              style={badgeStyle}
            >
              {stage.badge || (stage.status === 'running' ? 'running' : '')}
            </div>
            {/* 12px gap */}
            <div style={{ width: '12px' }} />
          </>
        )}

        {/* Timestamp */}
        {getTimestamp() && (
          <div 
            className="text-[10px] font-mono tabular-nums"
            style={{ color: 'rgba(240,244,255,0.25)' }}
          >
            {getTimestamp()}
          </div>
        )}
      </button>

      {/* Connector line to next stage */}
      {showConnector && (
        <div 
          className="absolute left-[28px] top-[52px] w-[1px] h-[1px]"
          style={{
            backgroundColor: stage.status === 'completed' ? 'rgba(29,158,117,0.4)' : 'rgba(255,255,255,0.08)',
            height: '1px', // Will be overridden by parent
          }}
        />
      )}
    </div>
  );
}
