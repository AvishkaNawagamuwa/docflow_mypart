import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle,
  Download,
  Maximize,
  Minimize,
  Rocket,
  Save,
  Wand2,
  ZoomIn,
  ZoomOut,
  Scan,
} from 'lucide-react';
import dagre from 'dagre';
import type { ReactFlowInstance } from 'reactflow';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

import { NodePalette } from '@/components/builder/NodePalette';
import { WorkflowCanvas } from '@/components/builder/WorkflowCanvas';
import { NodeProperties } from '@/components/builder/NodeProperties';
import { EdgeProperties } from '@/components/builder/EdgeProperties';

import type { NodeType } from '@/types/workflow';
import type { ActivityEdgeModel as ActivityEdge, ActivityNode, ActivityEdgeData, ActivityNodeData } from '@/components/builder/activity/types';
import { buildWorkflowDefinition } from '@/components/builder/activity/serializer';
import { nodeTypesInIssues, validateWorkflow, type ValidationIssue } from '@/components/builder/activity/validation';
import { getPredefinedWorkflowCanvas } from '@/data/predefinedWorkflowCanvases';
import { workflowApi } from '@/lib/workflowApi';

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
      return { width: 230, height: 70 };
    case 'sub-workflow':
      return { width: 250, height: 80 };
    case 'task':
    default:
      return { width: 260, height: 120 };
  }
};

const nodeSizeForLayout = (n: ActivityNode) => {
  const styleW = typeof n.style?.width === 'number' ? n.style.width : undefined;
  const styleH = typeof n.style?.height === 'number' ? n.style.height : undefined;
  const fallback = approxNodeSize(n.type as NodeType);
  return {
    width: styleW ?? fallback.width,
    height: styleH ?? fallback.height,
  };
};

export default function WorkflowBuilderPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const isNew = id === 'new';

  const routeDraft = (location.state as {
    draft?: {
      name?: string;
      description?: string;
      documentCategory?: string;
      documentType?: string;
      trigger?: 'onedrive' | 'manual' | 'api';
      triggerPath?: string;
      allowedFileTypes?: string[];
    };
  } | null)?.draft;

  const [workflowMeta, setWorkflowMeta] = useState({
    name: routeDraft?.name || 'New Workflow',
    description: routeDraft?.description || '',
    documentCategory: routeDraft?.documentCategory || 'general',
    documentType: routeDraft?.documentType || 'general',
    trigger: routeDraft?.trigger || 'manual',
    triggerPath: routeDraft?.triggerPath || '',
    allowedFileTypes: routeDraft?.allowedFileTypes || [],
  });
  const [loadedWorkflowUuid, setLoadedWorkflowUuid] = useState<string | null>(null);
  const [loadedWorkflowId, setLoadedWorkflowId] = useState<string | null>(null);

  const [nodes, setNodes] = useState<ActivityNode[]>([]);
  const [edges, setEdges] = useState<ActivityEdge[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const selectedNode = useMemo(() => (selectedNodeId ? nodes.find((n) => n.id === selectedNodeId) ?? null : null), [nodes, selectedNodeId]);
  const selectedEdge = useMemo(() => (selectedEdgeId ? edges.find((e) => e.id === selectedEdgeId) ?? null : null), [edges, selectedEdgeId]);

  const [hasChanges, setHasChanges] = useState(false);
  const [zoom, setZoom] = useState(1);

  const [rf, setRf] = useState<ReactFlowInstance<ActivityNodeData, ActivityEdgeData> | null>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [validationOpen, setValidationOpen] = useState(false);
  const [validationIssues, setValidationIssues] = useState<ValidationIssue[]>([]);

  const markDirty = useCallback(() => setHasChanges(true), []);

  useEffect(() => {
    if (!routeDraft) return;
    setWorkflowMeta((prev) => ({
      ...prev,
      name: routeDraft.name || prev.name,
      description: routeDraft.description || prev.description,
      documentCategory: routeDraft.documentCategory || prev.documentCategory,
      documentType: routeDraft.documentType || prev.documentType,
      trigger: routeDraft.trigger || prev.trigger,
      triggerPath: routeDraft.triggerPath || prev.triggerPath,
      allowedFileTypes: routeDraft.allowedFileTypes || prev.allowedFileTypes,
    }));
  }, [routeDraft]);

  useEffect(() => {
    if (!id || isNew) return;

    const toActivityNodes = (apiNodes: Array<Record<string, unknown>>): ActivityNode[] => {
      return apiNodes
        .filter((node) => typeof node?.id === 'string' && typeof node?.type === 'string')
        .map((node, index) => {
          const rawPosition = (node.position as Record<string, unknown> | undefined) || {};
          const x = typeof rawPosition.x === 'number' ? rawPosition.x : 120 + index * 40;
          const y = typeof rawPosition.y === 'number' ? rawPosition.y : 120 + index * 40;
          const nodeType = String(node.type) as NodeType;
          const size = approxNodeSize(nodeType);

          return {
            id: String(node.id),
            type: nodeType,
            position: { x, y },
            data: {
              name: typeof node.name === 'string' ? node.name : String(node.id),
              description: typeof node.description === 'string' ? node.description : '',
              assignedRoleId: typeof node.assignedRoleId === 'string' ? node.assignedRoleId : undefined,
              config: (node.config as ActivityNodeData['config']) || {},
            },
            style: { width: size.width, height: size.height },
          };
        });
    };

    const toActivityEdges = (apiConnections: Array<Record<string, unknown>>): ActivityEdge[] => {
      return apiConnections
        .filter(
          (edge) =>
            typeof edge?.sourceNodeId === 'string' &&
            typeof edge?.targetNodeId === 'string'
        )
        .map((edge, index) => ({
          id: typeof edge.id === 'string' ? edge.id : `edge-${index}`,
          type: 'activity',
          source: String(edge.sourceNodeId),
          target: String(edge.targetNodeId),
          data: {
            connectionType: (typeof edge.type === 'string' ? edge.type : 'default') as ActivityEdgeData['connectionType'],
            label: typeof edge.label === 'string' ? edge.label : undefined,
            condition: typeof edge.condition === 'string' ? edge.condition : undefined,
            isDefault: Boolean(edge.isDefault),
            priority: typeof edge.priority === 'number' ? edge.priority : 0,
          },
        }));
    };

    const loadWorkflowCanvas = async () => {
      try {
        let match = null as Awaited<ReturnType<typeof workflowApi.getWorkflow>> | null;

        try {
          match = await workflowApi.getWorkflow(id);
        } catch {
          const workflows = await workflowApi.listWorkflows();
          match = workflows.find((w) => w.workflowId === id) || null;
        }

        if (match) {
          setLoadedWorkflowUuid(match.uuid);
          setLoadedWorkflowId(match.workflowId);

          setWorkflowMeta((prev) => ({
            ...prev,
            name: match.name || prev.name,
            description: match.description || '',
            documentCategory: match.documentCategory || 'general',
            documentType: match.documentType || 'general',
            trigger: match.trigger || 'manual',
            triggerPath: match.triggerPath || '',
            allowedFileTypes: match.allowedFileTypes || [],
          }));

          const definition = (match.definition as Record<string, unknown> | undefined) || {};
          const rawNodes = Array.isArray((definition as { nodes?: unknown[] }).nodes)
            ? ((definition as { nodes: Record<string, unknown>[] }).nodes || [])
            : [];
          const rawConnections = Array.isArray((definition as { connections?: unknown[] }).connections)
            ? ((definition as { connections: Record<string, unknown>[] }).connections || [])
            : [];

          const apiNodes = rawNodes.length > 0 ? rawNodes : ((match as unknown as { nodes?: Record<string, unknown>[] }).nodes || []);
          const apiConnections =
            rawConnections.length > 0
              ? rawConnections
              : ((match as unknown as { connections?: Record<string, unknown>[] }).connections || []);

          setNodes(toActivityNodes(apiNodes));
          setEdges(toActivityEdges(apiConnections));
          setSelectedNodeId(null);
          setSelectedEdgeId(null);
          setHasChanges(false);

          return;
        }

        // Fallback for legacy mock template IDs.
        const predefined = getPredefinedWorkflowCanvas(id);
        if (predefined) {
          setNodes(predefined.nodes);
          setEdges(predefined.edges);
          setSelectedNodeId(null);
          setSelectedEdgeId(null);
          setHasChanges(false);
          setLoadedWorkflowUuid(null);
          setLoadedWorkflowId(id);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to load workflow';
        toast.error(message);
      }
    };

    void loadWorkflowCanvas();
  }, [id, isNew, rf]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      rf?.fitView({ padding: 0.18, duration: 250 });
    }, 60);
    return () => window.clearTimeout(t);
  }, [rf, nodes.length, edges.length]);

  const clearNodeErrors = useCallback(() => {
    setNodes((prev) =>
      prev.map((n) => ({
        ...n,
        data: {
          ...n.data,
          ui: {
            ...(n.data.ui || {}),
            hasError: false,
            errorMessages: [],
          },
        },
      }))
    );
  }, []);

  const applyValidationHighlights = useCallback((issues: ValidationIssue[]) => {
    const ids = nodeTypesInIssues(issues);
    const messagesByNode = new Map<string, string[]>();
    issues.forEach((i) => {
      if (!i.nodeId) return;
      if (!messagesByNode.has(i.nodeId)) messagesByNode.set(i.nodeId, []);
      messagesByNode.get(i.nodeId)!.push(i.message);
    });

    setNodes((prev) =>
      prev.map((n) => ({
        ...n,
        data: {
          ...n.data,
          ui: {
            ...(n.data.ui || {}),
            hasError: ids.has(n.id),
            errorMessages: messagesByNode.get(n.id) || [],
          },
        },
      }))
    );
  }, []);

  const handleNodeSelect = useCallback((node: ActivityNode | null) => {
    setSelectedNodeId(node?.id ?? null);
    if (node) setSelectedEdgeId(null);
  }, []);

  const handleEdgeSelect = useCallback((edge: ActivityEdge | null) => {
    setSelectedEdgeId(edge?.id ?? null);
    if (edge) setSelectedNodeId(null);
  }, []);

  const onInit = useCallback((instance: ReactFlowInstance<ActivityNodeData, ActivityEdgeData>) => {
    setRf(instance);
  }, []);

  const handleSave = async () => {
    const workflowId = isNew ? `wf-${Date.now()}` : (loadedWorkflowId || id as string);

    try {
      const definition = buildWorkflowDefinition({
        workflowId,
        name: workflowMeta.name,
        version: 1,
        nodes,
        edges,
      });

      const payload = {
        ...definition,
        description: workflowMeta.description,
        documentCategory: workflowMeta.documentCategory,
        documentType: workflowMeta.documentType,
        trigger: workflowMeta.trigger,
        triggerPath: workflowMeta.triggerPath,
        allowedFileTypes: workflowMeta.allowedFileTypes,
        status: 'draft',
      };

      if (!isNew && loadedWorkflowUuid) {
        await workflowApi.updateWorkflowDefinition(loadedWorkflowUuid, payload);
      } else {
        await workflowApi.saveWorkflowDefinition(payload);
      }

      toast.success('Workflow saved to Django as draft');
      setHasChanges(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to save workflow';
      toast.error(message);
    }
  };

  const handleValidate = () => {
    clearNodeErrors();
    const issues = validateWorkflow({ nodes, edges });
    setValidationIssues(issues);
    applyValidationHighlights(issues.filter((i) => i.severity === 'error'));
    setValidationOpen(true);
  };

  const focusNode = (nodeId?: string) => {
    if (!nodeId || !rf) return;
    const node = rf.getNode(nodeId);
    if (!node) return;
    rf.setCenter(node.position.x, node.position.y, { zoom: Math.min(1.2, Math.max(0.8, zoom)), duration: 450 });
    setSelectedNodeId(nodeId);
    setSelectedEdgeId(null);
  };

  const handlePublish = async () => {
    const issues = validateWorkflow({ nodes, edges });
    const errors = issues.filter((i) => i.severity === 'error');
    if (errors.length) {
      setValidationIssues(issues);
      applyValidationHighlights(errors);
      setValidationOpen(true);
      toast.error('Fix validation errors before publishing');
      return;
    }

    const workflowId = isNew ? `wf-${Date.now()}` : (loadedWorkflowId || id as string);
    let definition;
    try {
      definition = buildWorkflowDefinition({
        workflowId,
        name: workflowMeta.name,
        version: 1,
        nodes,
        edges,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error(`Export failed: ${msg}`);
      return;
    }

    try {
      const payload = {
        ...definition,
        description: workflowMeta.description,
        documentCategory: workflowMeta.documentCategory,
        documentType: workflowMeta.documentType,
        trigger: workflowMeta.trigger,
        triggerPath: workflowMeta.triggerPath,
        allowedFileTypes: workflowMeta.allowedFileTypes,
        status: 'active',
      };

      if (!isNew && loadedWorkflowUuid) {
        await workflowApi.updateWorkflowDefinition(loadedWorkflowUuid, payload);
      } else {
        await workflowApi.saveWorkflowDefinition(payload);
      }
      toast.success('Workflow published to Django');
      setHasChanges(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to publish workflow';
      toast.error(message);
    }
  };

  const handleExportJSON = () => {
    const workflowId = isNew ? `wf-${Date.now()}` : (id as string);
    let exportJson;
    try {
      exportJson = buildWorkflowDefinition({
        workflowId,
        name: workflowMeta.name,
        version: 1,
        nodes,
        edges,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error(`Export failed: ${msg}`);
      return;
    }

    const blob = new Blob([JSON.stringify(exportJson, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `workflow-definition-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('Workflow exported as JSON');
  };

  const handleAutoLayout = () => {
    const g = new dagre.graphlib.Graph();
    g.setDefaultEdgeLabel(() => ({}));
    g.setGraph({ rankdir: 'TB', nodesep: 60, ranksep: 80 });

    nodes.forEach((n) => {
      const size = nodeSizeForLayout(n);
      g.setNode(n.id, size);
    });

    edges.forEach((e) => g.setEdge(e.source, e.target));

    dagre.layout(g);

    setNodes((prev) =>
      prev.map((n) => {
        const p = g.node(n.id);
        if (!p) return n;
        const size = nodeSizeForLayout(n);
        return {
          ...n,
          position: { x: p.x - size.width / 2, y: p.y - size.height / 2 },
        };
      })
    );

    rf?.fitView({ padding: 0.18, duration: 450 });
    markDirty();
  };

  const toggleFullscreen = async () => {
    const el = canvasContainerRef.current;
    if (!el) return;

    try {
      if (!document.fullscreenElement) {
        await el.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch {
      toast.error('Fullscreen not available');
    }
  };

  const zoomIn = () => rf?.zoomIn({ duration: 150 });
  const zoomOut = () => rf?.zoomOut({ duration: 150 });
  const fit = () => rf?.fitView({ padding: 0.18, duration: 250 });

  const onDeleteNode = useCallback(
    (nodeId: string) => {
      setNodes((prev) => prev.filter((n) => n.id !== nodeId));
      setEdges((prev) => prev.filter((e) => e.source !== nodeId && e.target !== nodeId));
      setSelectedNodeId((prev) => (prev === nodeId ? null : prev));
      setSelectedEdgeId(null);
      markDirty();
      toast.success('Node deleted');
    },
    [markDirty]
  );

  const onDeleteEdge = useCallback(
    (edgeId: string) => {
      setEdges((prev) => prev.filter((e) => e.id !== edgeId));
      setSelectedEdgeId((prev) => (prev === edgeId ? null : prev));
      markDirty();
      toast.success('Transition deleted');
    },
    [markDirty]
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      const isTyping = tag === 'input' || tag === 'textarea' || (target?.getAttribute?.('contenteditable') === 'true');
      if (isTyping) return;

      if (e.key === 'Escape') {
        setSelectedNodeId(null);
        setSelectedEdgeId(null);
        return;
      }

      if (!selectedNodeId && !selectedEdgeId) return;

      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedEdgeId) {
        e.preventDefault();
        const edgeId = selectedEdgeId;
        setEdges((prev) => prev.filter((ed) => ed.id !== edgeId));
        setSelectedEdgeId(null);
        markDirty();
        toast.success('Transition deleted');
        return;
      }

      if (!selectedNodeId) return;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        const nodeId = selectedNodeId;
        setNodes((prev) => prev.filter((n) => n.id !== nodeId));
        setEdges((prev) => prev.filter((ed) => ed.source !== nodeId && ed.target !== nodeId));
        setSelectedNodeId(null);
        markDirty();
        toast.success('Node deleted');
        return;
      }

      const step = e.shiftKey ? 60 : 20;
      const delta =
        e.key === 'ArrowUp'
          ? { x: 0, y: -step }
          : e.key === 'ArrowDown'
            ? { x: 0, y: step }
            : e.key === 'ArrowLeft'
              ? { x: -step, y: 0 }
              : e.key === 'ArrowRight'
                ? { x: step, y: 0 }
                : null;

      if (!delta) return;
      e.preventDefault();
      setNodes((prev) =>
        prev.map((n) =>
          n.id === selectedNodeId
            ? {
              ...n,
              position: {
                x: Math.round((n.position.x + delta.x) / 20) * 20,
                y: Math.round((n.position.y + delta.y) / 20) * 20,
              },
            }
            : n
        )
      );
      markDirty();
    },
    [markDirty, selectedNodeId]
  );

  const onDragStart = (_type: NodeType) => {
    // kept for future drag feedback
  };

  const onUpdateNode = useCallback(
    (nodeId: string, updater: (node: ActivityNode) => ActivityNode) => {
      setNodes((prev) => prev.map((n) => (n.id === nodeId ? updater(n) : n)));
      markDirty();
    },
    [markDirty]
  );

  const onUpdateEdge = useCallback(
    (edgeId: string, updater: (edge: ActivityEdge) => ActivityEdge) => {
      setEdges((prev) => prev.map((e) => (e.id === edgeId ? updater(e) : e)));
      markDirty();
    },
    [markDirty]
  );

  // Mark dirty on any structural change coming from canvas interactions.
  const setNodesDirty = useCallback(
    (updater: React.SetStateAction<ActivityNode[]>) => {
      setNodes(updater);
      markDirty();
    },
    [markDirty]
  );
  const setEdgesDirty = useCallback(
    (updater: React.SetStateAction<ActivityEdge[]>) => {
      setEdges(updater);
      markDirty();
    },
    [markDirty]
  );

  const zoomPct = Math.round(zoom * 100);

  return (
    <div className="h-screen flex flex-col bg-background" tabIndex={0} onKeyDown={onKeyDown}>
      {/* Top Toolbar */}
      <div className="h-14 border-b border-border bg-card flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/workflows')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <div className="h-6 w-px bg-border" />

          <div>
            <h1 className="text-sm font-semibold text-foreground">{workflowMeta.name || (isNew ? 'New Workflow' : 'Edit Workflow')}</h1>
            <p className="text-xs text-muted-foreground">{hasChanges ? 'Unsaved changes' : 'All changes saved'}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 mr-2">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={zoomOut} aria-label="Zoom out">
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-xs text-muted-foreground w-12 text-center">{zoomPct}%</span>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={zoomIn} aria-label="Zoom in">
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={fit} aria-label="Fit to screen">
              <Scan className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleFullscreen} aria-label="Toggle fullscreen">
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </Button>
          </div>

          <Button variant="outline" size="sm" onClick={handleAutoLayout}>
            <Wand2 className="w-4 h-4 mr-2" />
            Auto layout
          </Button>

          <Button variant="outline" size="sm" onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            Save Draft
          </Button>

          <Button variant="outline" size="sm" onClick={handleValidate}>
            <CheckCircle className="w-4 h-4 mr-2" />
            Validate
          </Button>

          <Button variant="outline" size="sm" onClick={handleExportJSON}>
            <Download className="w-4 h-4 mr-2" />
            Export JSON
          </Button>

          <Button size="sm" onClick={handlePublish}>
            <Rocket className="w-4 h-4 mr-2" />
            Publish
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden min-w-0 min-h-0">
        <NodePalette onDragStart={onDragStart} />

        <div ref={canvasContainerRef} className="flex-1 flex min-w-0 min-h-0">
          <WorkflowCanvas
            nodes={nodes}
            edges={edges}
            setNodes={setNodesDirty}
            setEdges={setEdgesDirty}
            onNodeSelect={handleNodeSelect}
            onEdgeSelect={handleEdgeSelect}
            selectedNodeId={selectedNodeId}
            selectedEdgeId={selectedEdgeId}
            onInit={onInit}
            onZoomChange={setZoom}
          />
        </div>

        {selectedNode ? (
          <NodeProperties
            node={selectedNode}
            edges={edges}
            onClose={() => setSelectedNodeId(null)}
            onUpdateNode={onUpdateNode}
            onDeleteNode={onDeleteNode}
            onUpdateEdge={onUpdateEdge}
          />
        ) : selectedEdge ? (
          <EdgeProperties
            edge={selectedEdge}
            nodes={nodes}
            onClose={() => setSelectedEdgeId(null)}
            onUpdateEdge={onUpdateEdge}
            onDeleteEdge={onDeleteEdge}
          />
        ) : null}
      </div>

      {/* Bottom Status Bar */}
      <div className="h-8 border-t border-border bg-card flex items-center justify-between px-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <span>{nodes.length} nodes</span>
          <span>•</span>
          <span>{edges.length} transitions</span>
        </div>

        <div className="flex items-center gap-2">
          {nodes.filter((n) => n.type === 'start').length !== 1 ? <span className="text-warning">Missing/Multiple start</span> : null}
          {nodes.filter((n) => n.type === 'end').length < 1 ? <span className="text-warning">Missing end</span> : null}
        </div>
      </div>

      {/* Validation Modal */}
      <AlertDialog open={validationOpen} onOpenChange={setValidationOpen}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Validation Results</AlertDialogTitle>
            <AlertDialogDescription>
              Fix errors before publishing. Click an item to focus its node.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="max-h-[55vh] overflow-y-auto space-y-3">
            {validationIssues.length === 0 ? (
              <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm">✅ No issues found.</div>
            ) : (
              validationIssues.map((i, idx) => (
                <button
                  key={`${i.severity}-${idx}`}
                  className="w-full text-left rounded-lg border border-border p-3 hover:bg-muted/30 transition"
                  onClick={() => focusNode(i.nodeId)}
                >
                  <div className="flex items-start gap-2">
                    <div className={i.severity === 'error' ? 'text-destructive' : 'text-warning'}>
                      {i.severity === 'error' ? '❌' : '⚠️'}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-foreground">{i.message}</div>
                      {i.nodeId ? <div className="text-xs text-muted-foreground mt-0.5">Node: {i.nodeId}</div> : null}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setValidationOpen(false);
              }}
            >
              Done
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
