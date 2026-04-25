import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  Position,
  type EdgeProps,
  useReactFlow,
} from 'reactflow';
import { cn } from '@/lib/utils';
import type { ActivityEdgeData } from './types';
import { connectionLabel, connectionStroke } from './colors';

function ActivityEdgeImpl(props: EdgeProps<ActivityEdgeData>) {
  const { id, sourceX, sourceY, targetX, targetY, markerEnd, data, selected } = props;

  const { setEdges } = useReactFlow();
  const [editing, setEditing] = useState(false);
  const [draftLabel, setDraftLabel] = useState(data?.label ?? '');

  const routeOffset = data?.routeOffset ?? 0;

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    curvature: 0.35,
    sourcePosition: Position.Bottom,
    targetPosition: Position.Top,
  });

  const connectionType = data?.connectionType ?? 'default';
  const stroke = connectionStroke(connectionType);

  const primaryText = useMemo(() => {
    const l = data?.label?.trim();
    if (l) return l;
    const typeLabel = connectionLabel(connectionType).trim();
    if (typeLabel) return typeLabel;
    if (data?.isDefault) return 'Default';
    if (data?.condition?.trim()) return 'Branch';
    return '';
  }, [connectionType, data?.condition, data?.isDefault, data?.label]);

  const secondaryText = useMemo(() => {
    const c = data?.condition?.trim();
    if (!c) return '';
    return c;
  }, [data?.condition]);

  useEffect(() => {
    if (!editing) setDraftLabel(data?.label ?? '');
  }, [data?.label, editing]);

  const commit = useCallback(() => {
    setEdges((prev) =>
      (prev as any[]).map((e) => (e.id === id ? { ...e, data: { ...e.data, label: draftLabel } } : e))
    );
    setEditing(false);
  }, [draftLabel, id, setEdges]);

  const cancel = useCallback(() => {
    setDraftLabel(data?.label ?? '');
    setEditing(false);
  }, [data?.label]);

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke,
          strokeWidth: selected ? 3 : 2,
          strokeDasharray: data?.style?.dashed ? '6 6' : undefined,
          filter: selected ? 'drop-shadow(0 0 8px color-mix(in oklab, ' + stroke + ' 55%, transparent))' : undefined,
          transform: routeOffset ? `translate(${routeOffset}px, 0px)` : undefined,
        }}
        interactionWidth={18}
      />

      {primaryText || secondaryText ? (
        <EdgeLabelRenderer>
          <div
            className={cn(
              'nodrag nopan absolute -translate-x-1/2 -translate-y-1/2',
              'rounded-md border bg-card px-2 py-1 text-[11px] text-foreground shadow-sm',
              selected ? 'shadow-md pointer-events-auto' : 'pointer-events-none'
            )}
            style={{
              transform: `translate(-50%, -50%) translate(${labelX + routeOffset}px, ${labelY}px)`,
              borderColor: stroke,
            }}
            onDoubleClick={(e) => {
              if (!selected) return;
              e.preventDefault();
              e.stopPropagation();
              setEditing(true);
            }}
          >
            {editing ? (
              <input
                className="w-44 bg-transparent outline-none font-medium"
                value={draftLabel}
                autoFocus
                onChange={(e) => setDraftLabel(e.target.value)}
                onBlur={commit}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    commit();
                  }
                  if (e.key === 'Escape') {
                    e.preventDefault();
                    cancel();
                  }
                }}
              />
            ) : (
              <div className="leading-tight">
                {primaryText ? <div className="font-medium">{primaryText}</div> : null}
                {secondaryText ? <div className="mt-0.5 text-[10px] text-muted-foreground">{secondaryText}</div> : null}
              </div>
            )}
          </div>
        </EdgeLabelRenderer>
      ) : null}
    </>
  );
}

export const ActivityEdge = memo(ActivityEdgeImpl);
