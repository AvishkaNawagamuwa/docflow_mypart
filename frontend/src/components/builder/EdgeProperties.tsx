import { useMemo, useState } from 'react';
import { Trash2, X } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

import type { ActivityEdgeModel as ActivityEdge, ActivityNode } from '@/components/builder/activity/types';
import { connectionLabel } from '@/components/builder/activity/colors';
import { testConditionExpression } from '@/lib/conditionEvaluator';

interface EdgePropertiesProps {
  edge: ActivityEdge;
  nodes: ActivityNode[];
  onClose: () => void;
  onUpdateEdge: (edgeId: string, updater: (edge: ActivityEdge) => ActivityEdge) => void;
  onDeleteEdge: (edgeId: string) => void;
}

const defaultContext = JSON.stringify(
  {
    amount: 12000,
    user: { role: 'Manager' },
    doc: { type: 'Invoice', priority: 'High' },
  },
  null,
  2
);

export function EdgeProperties({ edge, nodes, onClose, onUpdateEdge, onDeleteEdge }: EdgePropertiesProps) {
  const sourceNode = useMemo(() => nodes.find((n) => n.id === edge.source) ?? null, [nodes, edge.source]);
  const targetNode = useMemo(() => nodes.find((n) => n.id === edge.target) ?? null, [nodes, edge.target]);

  const [contextText, setContextText] = useState(defaultContext);

  const typeLabel = edge.data?.connectionType ? connectionLabel(edge.data.connectionType) : '';
  const derivedTypeName = edge.data?.connectionType ?? 'default';

  return (
    <div className="w-96 bg-card border-l border-border flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="min-w-0">
          <div className="truncate font-semibold text-foreground">Transition</div>
          <div className="text-xs text-muted-foreground">
            {sourceNode?.data.name ?? edge.source} → {targetNode?.data.name ?? edge.target}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDeleteEdge(edge.id)}
            aria-label="Delete transition"
          >
            <Trash2 className="w-4 h-4 text-destructive" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close panel">
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="w-full grid grid-cols-4 sticky top-0 bg-card z-10">
            <TabsTrigger value="basic">Basic</TabsTrigger>
            <TabsTrigger value="condition">Condition</TabsTrigger>
            <TabsTrigger value="styling">Styling</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="p-4 space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="border">
                {derivedTypeName.toUpperCase()}
              </Badge>
              <div className="text-xs text-muted-foreground">
                {typeLabel ? typeLabel : 'Transition type is derived from the output port used.'}
              </div>
            </div>

            <div>
              <Label htmlFor="edgeLabel">Label</Label>
              <Input
                id="edgeLabel"
                value={edge.data?.label ?? ''}
                onChange={(e) =>
                  onUpdateEdge(edge.id, (ed) => ({
                    ...ed,
                    data: { ...ed.data, label: e.target.value },
                  }))
                }
                className="mt-1.5"
                placeholder={edge.data?.connectionType === 'default' ? (edge.data?.isDefault ? 'Default' : 'Branch') : typeLabel}
              />
              <div className="mt-1 text-xs text-muted-foreground">Tip: double-click the edge label to edit inline.</div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="edgePriority">Priority</Label>
                <Input
                  id="edgePriority"
                  type="number"
                  value={edge.data?.priority ?? ''}
                  onChange={(e) =>
                    onUpdateEdge(edge.id, (ed) => ({
                      ...ed,
                      data: {
                        ...ed.data,
                        priority: e.target.value === '' ? undefined : Number(e.target.value),
                      },
                    }))
                  }
                  className="mt-1.5"
                  placeholder="(auto)"
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2 mt-6">
                <span className="text-sm">Default</span>
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={!!edge.data?.isDefault}
                  onChange={(event) =>
                    onUpdateEdge(edge.id, (ed) => ({
                      ...ed,
                      data: { ...ed.data, isDefault: event.target.checked },
                    }))
                  }
                />
              </div>
            </div>

            <Separator />
            <div className="text-xs text-muted-foreground">
              Decision transitions should have exactly one Default branch, and each non-default branch should have a unique condition.
            </div>
          </TabsContent>

          <TabsContent value="condition" className="p-4 space-y-4">
            <div>
              <Label htmlFor="edgeCondition">Condition Expression</Label>
              <Input
                id="edgeCondition"
                value={edge.data?.condition ?? ''}
                onChange={(e) =>
                  onUpdateEdge(edge.id, (ed) => ({
                    ...ed,
                    data: { ...ed.data, condition: e.target.value },
                  }))
                }
                className="mt-1.5"
                placeholder='e.g. amount > 10000 && user.role == "Manager"'
              />
              <div className="mt-1 text-xs text-muted-foreground">
                Supported: identifiers, member access, literals, + - * / %, comparisons, &&, ||, ternary.
              </div>
            </div>

            <div>
              <Label htmlFor="edgeContext">Test Context (JSON)</Label>
              <Textarea
                id="edgeContext"
                value={contextText}
                onChange={(e) => setContextText(e.target.value)}
                className="mt-1.5 font-mono text-xs"
                rows={8}
              />
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  let ctx: unknown;
                  try {
                    ctx = JSON.parse(contextText);
                  } catch {
                    toast.error('Context JSON is invalid');
                    return;
                  }

                  const res = testConditionExpression(edge.data?.condition ?? '', ctx);
                  if (res.ok) {
                    toast.success(`Result: ${res.truthy ? 'true' : 'false'} (${String(res.value)})`);
                  } else {
                    toast.error((res as { ok: false; error: string }).error);
                  }
                }}
              >
                Test Condition
              </Button>
              <div className="text-xs text-muted-foreground">No eval; parsed and evaluated safely.</div>
            </div>
          </TabsContent>

          <TabsContent value="styling" className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Dashed</span>
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={!!edge.data?.style?.dashed}
                onChange={(event) =>
                  onUpdateEdge(edge.id, (ed) => ({
                    ...ed,
                    data: { ...ed.data, style: { ...(ed.data?.style || {}), dashed: event.target.checked } },
                  }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm">Animated</span>
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={!!edge.animated}
                onChange={(event) => onUpdateEdge(edge.id, (ed) => ({ ...ed, animated: event.target.checked }))}
              />
            </div>

            <div className="text-xs text-muted-foreground">
              Color is automatically derived from transition type.
            </div>
          </TabsContent>

          <TabsContent value="advanced" className="p-4 space-y-4">
            <div className="rounded-lg border border-border p-3">
              <div className="text-xs text-muted-foreground">Transition ID</div>
              <div className="font-mono text-xs text-foreground mt-1 break-all">{edge.id}</div>
            </div>

            <div>
              <Label htmlFor="edgeMeta">Execution Metadata (JSON)</Label>
              <Textarea
                id="edgeMeta"
                value={edge.data?.executionMetaJson ?? ''}
                onChange={(e) =>
                  onUpdateEdge(edge.id, (ed) => ({
                    ...ed,
                    data: { ...ed.data, executionMetaJson: e.target.value },
                  }))
                }
                className="mt-1.5 font-mono text-xs"
                rows={6}
                placeholder='{"retryPolicy":"none"}'
              />
              <div className="mt-1 text-xs text-muted-foreground">Stored as raw JSON text; validated on publish/export.</div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
