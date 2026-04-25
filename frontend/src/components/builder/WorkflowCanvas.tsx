import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactFlow, {
  Background,
  ConnectionLineType,
  Controls,
  MiniMap,
  ReactFlowProvider,
  addEdge,
  applyNodeChanges,
  MarkerType,
  type Connection,
  type ReactFlowInstance,
  type NodeMouseHandler,
  type EdgeMouseHandler,
  type Edge,
  type Node,
  type NodeChange,
  useStore,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { NodeType } from '@/types/workflow';
import { ActivityEdge } from '@/components/builder/activity/ActivityEdge';
import { activityNodeTypes } from '@/components/builder/activity/nodeTypes';
import {
  connectionTypeFromSourceHandle,
  type ActivityEdgeModel as ActivityEdgeT,
  type ActivityNode as ActivityNodeT,
  type ActivityEdgeData,
  type ActivityNodeData,
} from '@/components/builder/activity/types';
import { connectionStroke } from '@/components/builder/activity/colors';
import { defaultNameForType } from '@/components/builder/activity/validation';

interface WorkflowCanvasProps {
  nodes: ActivityNodeT[];
  edges: ActivityEdgeT[];
  setNodes: React.Dispatch<React.SetStateAction<ActivityNodeT[]>>;
  setEdges: React.Dispatch<React.SetStateAction<ActivityEdgeT[]>>;
  onNodeSelect: (node: ActivityNodeT | null) => void;
  onEdgeSelect: (edge: ActivityEdgeT | null) => void;
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  onInit?: (instance: ReactFlowInstance<ActivityNodeData, ActivityEdgeData>) => void;
  onZoomChange?: (zoom: number) => void;
}

const GRID: [number, number] = [20, 20];

const approxNodeSize = (type: NodeType) => {
  switch (type) {
    case 'start':
      return { width: 70, height: 70 };
    case 'end':
      return { width: 78, height: 78 };
    case 'decision':
      return { width: 160, height: 160 };
    case 'merge':
      return { width: 150, height: 150 };
    case 'parallel-split':
    case 'parallel-join':
      return { width: 90, height: 90 };
    case 'timer':
      return { width: 240, height: 60 };
    case 'escalation':
      return { width: 250, height: 70 };
    case 'notification':
      return { width: 200, height: 90 };
    case 'sub-workflow':
      return { width: 250, height: 80 };
    case 'task':
    default:
      return { width: 260, height: 120 };
  }
};

const defaultNodeStyle = (type: NodeType): React.CSSProperties | undefined => {
  const { width, height } = approxNodeSize(type);
  // Start/End are iconic and intentionally non-resizable.
  if (type === 'start' || type === 'end') return { width, height };
  return { width, height };
};

function AlignmentGuidesOverlay({ guideX, guideY }: { guideX?: number; guideY?: number }) {
  const transform = useStore((s) => s.transform);
  if (!guideX && !guideY) return null;

  const [tx, ty, zoom] = transform;

  return (
    <svg className="absolute inset-0 pointer-events-none" style={{ zIndex: 5 }}>
      <g transform={`translate(${tx} ${ty}) scale(${zoom})`}>
        {typeof guideX === 'number' ? (
          <line
            x1={guideX}
            x2={guideX}
            y1={-5000}
            y2={5000}
            stroke="hsl(var(--primary) / 0.35)"
            strokeWidth={1}
          />
        ) : null}
        {typeof guideY === 'number' ? (
          <line
            x1={-5000}
            x2={5000}
            y1={guideY}
            y2={guideY}
            stroke="hsl(var(--primary) / 0.35)"
            strokeWidth={1}
          />
        ) : null}
      </g>
    </svg>
  );
}

function WorkflowCanvasInner(props: WorkflowCanvasProps) {
  const { nodes, edges, setNodes, setEdges, onNodeSelect, onEdgeSelect, selectedNodeId, selectedEdgeId, onInit, onZoomChange } = props;

  const wrapperRef = useRef<HTMLDivElement>(null);
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance<ActivityNodeData, ActivityEdgeData> | null>(null);
  const [guide, setGuide] = useState<{ x?: number; y?: number }>({});

  const edgeTypes = useMemo(() => ({ activity: ActivityEdge }), []);

  // Add slight offsets for multiple edges between same endpoints to reduce overlap.
  const routedEdges = useMemo(() => {
    const selectedNode = selectedNodeId ? nodes.find((n) => n.id === selectedNodeId) : null;
    const animateFromSplit = selectedNode?.type === 'parallel-split' ? selectedNode.id : null;
    const waitingJoinIds = new Set(
      nodes.filter((n) => n.type === 'parallel-join' && n.data.ui?.simulateWaiting).map((n) => n.id)
    );

    const grouped = new Map<string, string[]>();
    edges.forEach((e) => {
      const key = `${e.source}::${e.target}`;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(e.id);
    });

    const offsetByEdgeId = new Map<string, number>();
    grouped.forEach((ids) => {
      if (ids.length <= 1) return;
      const start = -((ids.length - 1) / 2);
      ids.forEach((id, idx) => {
        offsetByEdgeId.set(id, (start + idx) * 14);
      });
    });

    return edges.map((e) => ({
      ...e,
      type: 'activity' as const,
      className: [e.className, 'activity-edge', waitingJoinIds.has(e.target) ? 'activity-edge-wait' : '']
        .filter(Boolean)
        .join(' '),
      animated: (animateFromSplit && e.source === animateFromSplit) || waitingJoinIds.has(e.target) || !!e.animated,
      data: {
        ...e.data,
        routeOffset: offsetByEdgeId.get(e.id) ?? 0,
      },
    }));
  }, [edges, nodes, selectedNodeId]);

  const isValidConnection = useCallback(
    (c: Connection): boolean => {
      if (!c.source || !c.target) return false;
      if (c.source === c.target) return false;

      const source = nodes.find((n) => n.id === c.source);
      const target = nodes.find((n) => n.id === c.target);
      if (!source || !target) return false;

      if (target.type === 'start') return false;
      if (source.type === 'end') return false;

      // Start: exactly one outgoing
      if (source.type === 'start') {
        const outgoing = edges.filter((e) => e.source === source.id).length;
        if (outgoing >= 1) return false;
      }

      // End: no outgoing (handled above)
      // Prevent duplicate
      if (edges.some((e) => e.source === c.source && e.target === c.target && (e.sourceHandle || '') === (c.sourceHandle || ''))) {
        return false;
      }

      return true;
    },
    [nodes, edges]
  );

  const onConnect = useCallback(
    (c: Connection) => {
      if (!isValidConnection(c)) {
        toast.error('Invalid connection');
        return;
      }

      const connectionType = connectionTypeFromSourceHandle(c.sourceHandle);
      const stroke = connectionStroke(connectionType);

      const sourceNode = nodes.find((n) => n.id === c.source);
      const outgoingFromSource = edges.filter((e) => e.source === c.source).length;
      const isDecision = sourceNode?.type === 'decision';
      const isDefault = isDecision && c.sourceHandle === 'default';
      const priority = isDecision ? (isDefault ? 999 : outgoingFromSource + 1) : undefined;

      const newEdge: ActivityEdgeT = {
        id: `edge-${Date.now()}`,
        type: 'activity',
        source: c.source!,
        target: c.target!,
        sourceHandle: c.sourceHandle,
        targetHandle: c.targetHandle,
        className: 'activity-edge',
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: stroke,
          width: 18,
          height: 18,
        },
        data: {
          connectionType,
          label: undefined,
          condition: undefined,
          isDefault,
          priority,
          style: {
            dashed: connectionType === 'default' && !isDefault && isDecision,
          },
        },
      };

      setEdges((eds) => addEdge(newEdge, eds) as ActivityEdgeT[]);
    },
    [edges, isValidConnection, nodes, setEdges]
  );

  const onNodeClick: NodeMouseHandler = useCallback(
    (_evt, node) => {
      onNodeSelect(node as ActivityNodeT);
      onEdgeSelect(null);
    },
    [onEdgeSelect, onNodeSelect]
  );

  const onEdgeClick: EdgeMouseHandler = useCallback(
    (_evt, edge) => {
      onEdgeSelect(edge as ActivityEdgeT);
      onNodeSelect(null);
    },
    [onEdgeSelect, onNodeSelect]
  );

  const onNodeDrag = useCallback(
    (_evt: unknown, dragged: Node<ActivityNodeData>) => {
      const threshold = 6;

      const draggedSize = approxNodeSize(dragged.type as NodeType);
      const draggedCx = dragged.position.x + draggedSize.width / 2;
      const draggedCy = dragged.position.y + draggedSize.height / 2;

      let guideX: number | undefined;
      let guideY: number | undefined;

      for (const n of nodes) {
        if (n.id === dragged.id) continue;
        const otherSize = approxNodeSize(n.type as NodeType);
        const otherCx = n.position.x + otherSize.width / 2;
        const otherCy = n.position.y + otherSize.height / 2;

        if (Math.abs(draggedCx - otherCx) <= threshold) guideX = otherCx;
        if (Math.abs(draggedCy - otherCy) <= threshold) guideY = otherCy;
        if (guideX && guideY) break;
      }

      setGuide({ x: guideX, y: guideY });
    },
    [nodes]
  );

  const onNodeDragStop = useCallback(() => setGuide({}), []);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      setNodes((prev) => applyNodeChanges(changes, prev as Node[]) as ActivityNodeT[]);
    },
    [setNodes]
  );

  // DnD add node
  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const nodeType = e.dataTransfer.getData('nodeType') as NodeType;
      if (!nodeType) return;
      if (!rfInstance || !wrapperRef.current) return;

      if (nodeType === 'start' && nodes.some((n) => n.type === 'start')) {
        toast.error('Only one Start node is allowed');
        return;
      }

      const position = rfInstance.screenToFlowPosition({ x: e.clientX, y: e.clientY });

      const newNode: ActivityNodeT = {
        id: `node-${Date.now()}`,
        type: nodeType,
        position,
        style: defaultNodeStyle(nodeType),
        data: {
          name: defaultNameForType(nodeType),
          description: '',
          assignedRoleId: undefined,
          config:
            nodeType === 'parallel-split'
              ? { parallelType: 'split' }
              : nodeType === 'parallel-join'
                ? { parallelType: 'join' }
                : {},
        },
      };

      setNodes((nds) => nds.concat(newNode));
      onNodeSelect(newNode);
    },
    [nodes, onNodeSelect, rfInstance, setNodes]
  );

  const selectedNode = useMemo(
    () => (selectedNodeId ? nodes.find((n) => n.id === selectedNodeId) ?? null : null),
    [nodes, selectedNodeId]
  );

  // Keep selection stable if nodes array updates.
  useEffect(() => {
    if (selectedNodeId && !selectedNode) onNodeSelect(null);
  }, [selectedNode, selectedNodeId, onNodeSelect]);

  // Expose zoom to toolbar.
  const onMove = useCallback(
    (_e: unknown, viewport: { x: number; y: number; zoom: number }) => {
      onZoomChange?.(viewport.zoom);
    },
    [onZoomChange]
  );

  return (
    <div
      ref={wrapperRef}
      className="flex-1 relative bg-canvas-bg w-full h-full min-w-0 min-h-0"
      onDrop={onDrop}
      onDragOver={onDragOver}
    >
      <ReactFlow
        className="w-full h-full"
        nodes={nodes as Node<ActivityNodeData>[]}
        edges={routedEdges as Edge<ActivityEdgeData>[]}
        nodeTypes={activityNodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.18 }}
        minZoom={0.25}
        maxZoom={2}
        snapToGrid
        snapGrid={GRID}
        connectionLineType={ConnectionLineType.Bezier}
        connectionLineStyle={{ strokeWidth: 2, strokeDasharray: '6 6', stroke: 'hsl(var(--primary))' }}
        isValidConnection={isValidConnection}
        onConnect={onConnect}
        onNodesChange={onNodesChange}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        onNodeDrag={onNodeDrag}
        onNodeDragStop={onNodeDragStop}
        onPaneClick={() => {
          onNodeSelect(null);
          onEdgeSelect(null);
        }}
        onInit={(instance) => {
          setRfInstance(instance);
          onInit?.(instance);
        }}
        onMove={onMove}
        onSelectionChange={(sel) => {
          const edge = sel.edges?.[0] as ActivityEdgeT | undefined;
          const node = sel.nodes?.[0] as ActivityNodeT | undefined;
          if (node) {
            onNodeSelect(node);
            onEdgeSelect(null);
            return;
          }
          if (edge) {
            onEdgeSelect(edge);
            onNodeSelect(null);
            return;
          }
          if (!selectedNodeId && !selectedEdgeId) return;
          onNodeSelect(null);
          onEdgeSelect(null);
        }}
        defaultEdgeOptions={{ type: 'activity' }}
        elevateEdgesOnSelect
        proOptions={{ hideAttribution: true }}
      >
        <Background color="hsl(var(--canvas-grid))" gap={20} size={1} />
        <AlignmentGuidesOverlay guideX={guide.x} guideY={guide.y} />
        <Controls
          position="bottom-left"
          showInteractive={false}
          className="rounded-lg border border-border bg-card shadow-sm"
        />
        <MiniMap
          position="bottom-right"
          className="rounded-lg border border-border bg-card shadow-sm"
          maskColor="hsl(var(--background) / 0.55)"
          nodeStrokeWidth={3}
          nodeColor={(n) => {
            // keep minimap enterprise-friendly
            switch (n.type as NodeType) {
              case 'start':
                return 'hsl(var(--node-start))';
              case 'end':
                return 'hsl(var(--node-end))';
              case 'decision':
                return 'hsl(var(--node-decision))';
              case 'merge':
                return 'hsl(var(--node-decision))';
              case 'task':
                return 'hsl(var(--node-task))';
              case 'parallel-split':
              case 'parallel-join':
                return 'hsl(var(--node-parallel))';
              default:
                return 'hsl(var(--primary))';
            }
          }}
        />
      </ReactFlow>
    </div>
  );
}

export function WorkflowCanvas(props: WorkflowCanvasProps) {
  return (
    <ReactFlowProvider>
      <WorkflowCanvasInner {...props} />
    </ReactFlowProvider>
  );
}
