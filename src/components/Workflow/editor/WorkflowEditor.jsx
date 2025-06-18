import React, { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  useReactFlow,
  ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import StartNode from './nodes/StartNode';
import ProcessNode from './nodes/ProcessNode';
import DecisionNode from './nodes/DecisionNode';
import EndNode from './nodes/EndNode';
import FunctionNode from './nodes/FunctionNode';
import ResponseNode from './nodes/ResponseNode';
import NodeDetails from './NodeDetails';
import PageViewer from './PageViewer';
import GlassButtonNode from './nodes/GlassButtonNode';

import { workflowEndpoints, aiFunctionsEndpoints } from '../../../utils/apis';
import { v4 as uuidv4 } from 'uuid';
import ChatNoHistory from '../../Chat/ChatNoHistory';
import WorkflowEditorSidebar from './WorkflowEditorSidebar';
const nodeTypes = {
  start: StartNode,
  process: ProcessNode,
  decision: DecisionNode,
  end: EndNode,
  function: FunctionNode,
  response: ResponseNode,
  glassButton: GlassButtonNode,

};

const initialNodes = [
  {
    id: '1',
    type: 'start',
    position: { x: 50, y: 250 },
    data: {
      label: 'شروع',
      description: 'نقطه شروع فرآیند',
      jsonConfig: null,
      pageConfig: {
        showPage: false,
        pageUrl: '',
        closeOnAction: false
      }
    },
  },
];

const WorkflowEditorContent = () => {
  const { workflowId } = useParams();
  const navigate = useNavigate();
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedEdge, setSelectedEdge] = useState(null);
  const [activePage, setActivePage] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [workflowName, setWorkflowName] = useState('');
  const [showFunctionModal, setShowFunctionModal] = useState(false);
  const [aiFunctions, setAiFunctions] = useState([]);
  const [showChatModal, setShowChatModal] = useState(false);
  const reactFlowInstance = useReactFlow();

  useEffect(() => {
    if (showChatModal) {
      window.parent.postMessage({ type: 'HIDE_NAVBAR' }, '*');
    }
  }, [showChatModal]);

  useEffect(() => {
    const fetchWorkflow = async () => {
      if (!workflowId) return;

      try {
        setLoading(true);
        setError(null);
        const workflow = await workflowEndpoints.getWorkflow(workflowId);

        setWorkflowName(workflow.name || '');

        const workflowNodes = workflow.flow.map((step) => {
          // استخراج value از ele برای گره‌های glassButton
          let value = step.value || '';
          let text = step.text || '';
          if (step.type === 'glassButton' && step.ele) {
            // استفاده از regex برای استخراج data-value
            const valueMatch = step.ele.match(/data-value='\[(.*?)\]'/);
            if (valueMatch && valueMatch[1]) {
              value = valueMatch[1]; // مقدار داخل کروشه
            }
            // متن دکمه به‌صورت ثابت
            text = 'شماره سریال';
          }

          return {
            id: step.id,
            type: step.type === 'action' ? 'process' : step.type === 'glassButton' ? 'glassButton' : step.type,
            position: {
              x: step.position?.x ?? 50,
              y: step.position?.y ?? 250,
            },
            data: {
              label: step.label || step.name || '', // استفاده از name اگر label وجود نداشت
              description: step.description || '',
              value, // تنظیم value استخراج‌شده
              text,  // تنظیم text
              conditions: step.type === 'decision' ? (step.conditions || []).map((c) => c.label) : [],
              conditionTargets: step.type === 'decision'
                  ? (step.conditions || []).reduce((acc, c) => {
                    acc[c.label] = c.next;
                    return acc;
                  }, {})
                  : {},
              jsonConfig: null,
              pageConfig: {
                showPage: false,
                pageUrl: '',
                closeOnAction: false,
              },
            },
          };
        });

        const workflowEdges = workflow.flow.reduce((acc, step) => {
          if (step.type === 'decision' && step.conditions) {
            step.conditions.forEach((condition) => {
              if (condition.next) {
                acc.push({
                  id: `${step.id}-${condition.next}-${condition.label}`,
                  source: step.id,
                  target: condition.next,
                  sourceHandle: condition.label,
                  type: 'step',
                  animated: true,
                  style: { stroke: '#f59e0b' },
                });
              }
            });
          } else if (step.next) {
            acc.push({
              id: `${step.id}-${step.next}`,
              source: step.id,
              target: step.next,
              type: 'step',
              animated: true,
              style: { stroke: '#f59e0b' },
            });
          }
          return acc;
        }, []);

        setNodes(workflowNodes);
        setEdges(workflowEdges);
      } catch (err) {
        console.error('Error fetching workflow:', err);
        setError('خطا در دریافت اطلاعات گردش کار');
      } finally {
        setLoading(false);
      }
    };

    fetchWorkflow();
  }, [workflowId, setNodes, setEdges]);
  const onConnect = useCallback(
      (params) => {
        const sourceNode = nodes.find((node) => node.id === params.source);

        if (sourceNode?.type === 'start' || sourceNode?.type === 'glassButton') {
          params.sourceHandle = 'bottom';
        }

        if (sourceNode?.type === 'decision') {
          if (!params.sourceHandle || !sourceNode.data.conditions.includes(params.sourceHandle)) {
            console.warn(`Invalid sourceHandle: ${params.sourceHandle}`);
            return;
          }
        }

        if (sourceNode?.type !== 'decision') {
          const existingOutgoingEdges = edges.filter(edge => edge.source === params.source);
          if (existingOutgoingEdges.length > 0) {
            console.warn('Only decision nodes can have multiple outgoing connections');
            return;
          }
        }

        setEdges((eds) => {
          return addEdge(
              {
                ...params,
                id: `${params.source}-${params.sourceHandle}-${params.target}-${Date.now()}`,
                type: 'step',
                animated: true,
                style: { stroke: '#f59e0b' },
              },
              eds
          );
        });
      },
      [setEdges, nodes, edges]
  );

  const onNodeClick = useCallback((event, node) => {
    setSelectedNode(node);

    if (node.data.pageConfig?.showPage) {
      setActivePage(node.data.pageConfig);
    }
  }, []);

  const onNodeUpdate = useCallback((nodeId, newData) => {
    console.log('Updating node:', nodeId, newData); // لاگ برای دیباگ
    setNodes((nds) => {
      const updatedNodes = nds.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              ...newData,
              conditions: newData.conditions?.filter((c) => c && c.trim() !== '') || [],
            },
          };
        }
        return node;
      });
      console.log('Updated nodes:', updatedNodes); // لاگ برای دیباگ
      return updatedNodes;
    });

    if (newData.type === 'decision') {
      setEdges((eds) => {
        const otherEdges = eds.filter((edge) => edge.source !== nodeId);
        const newConditions = newData.conditions?.filter((c) => c && c.trim() !== '') || [];
        const validEdges = eds.filter(
            (edge) => edge.source === nodeId && newConditions.includes(edge.sourceHandle)
        );
        const newEdges = newConditions
            .filter((condition) => !validEdges.some((edge) => edge.sourceHandle === condition))
            .map((condition, index) => ({
              id: `${nodeId}-${condition}-${index}`,
              source: nodeId,
              target: null,
              sourceHandle: condition,
              type: 'step',
              animated: true,
              style: { stroke: '#f59e0b' },
            }));

        console.log('Updated edges:', [...otherEdges, ...validEdges, ...newEdges]); // لاگ برای دیباگ
        return [...otherEdges, ...validEdges, ...newEdges];
      });
    }
  }, [setNodes, setEdges]);

  const fetchAiFunctions = useCallback(async () => {
    try {
      const data = await aiFunctionsEndpoints.getFunctionsMap();
      setAiFunctions(data.functions || []);
    } catch (err) {
      console.error('Error fetching AI functions:', err);
      toast.error('خطا در دریافت لیست توابع');
    }
  }, []);

  useEffect(() => {
    fetchAiFunctions();
  }, [fetchAiFunctions]);

  const addNode = (type) => {
    if (type === 'function') {
      setShowFunctionModal(true);
      return;
    }

    const { x, y, zoom } = reactFlowInstance.getViewport();
    const centerX = -x + window.innerWidth / 2 / zoom;
    const centerY = -y + window.innerHeight / 2 / zoom;

    const newNode = {
      id: uuidv4(),
      type,
      position: {
        x: centerX,
        y: centerY,
      },
      data: {
        label:
            type === 'start'
                ? 'شروع'
                : type === 'process'
                    ? 'فرآیند'
                    : type === 'decision'
                        ? 'تصمیم'
                        : type === 'function'
                            ? 'تابع'
                            : type === 'response'
                                ? 'پاسخ'
                                : type === 'glassButton'
                                    ? 'دکمه شیشه‌ای'
                                    : 'پایان',
        description: '',
        value: type === 'glassButton' ? '' : undefined,
        text: type === 'glassButton' ? '' : undefined, // اضافه کردن text
        connections: [],
        conditions: type === 'decision' ? ['شرط پیش‌فرض'] : [],
        jsonConfig: null,
        pageConfig: {
          showPage: false,
          pageUrl: '',
          closeOnAction: false,
        },
      },
    };
    console.log('Adding new node:', newNode);
    setNodes((nds) => [...nds, newNode]);
  };

  const addFunctionNode = (functionData) => {
    const { x, y, zoom } = reactFlowInstance.getViewport();
    const centerX = -x + (window.innerWidth / 2 / zoom);
    const centerY = -y + (window.innerHeight / 2 / zoom);

    const newNode = {
      id: uuidv4(),
      type: 'function',
      position: {
        x: centerX,
        y: centerY,
      },
      data: {
        label: functionData.name,
        description: functionData.description,
        functionData: functionData,
        connections: [],
        jsonConfig: null,
        pageConfig: {
          showPage: false,
          pageUrl: '',
          closeOnAction: false,
        },
      },
    };
    setNodes((nds) => [...nds, newNode]);
    setShowFunctionModal(false);
  };

  const handlePageClose = useCallback(() => {
    setActivePage(null);
  }, []);

  const deleteNode = useCallback((nodeId) => {
    setNodes((nds) => nds.filter((node) => node.id !== nodeId));
    setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
  }, [setNodes, setEdges]);

  const onEdgeClick = useCallback((event, edge) => {
    setSelectedEdge(edge);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedEdge(null);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Delete') {
        if (selectedEdge) {
          setEdges((eds) => eds.filter((edge) => edge.id !== selectedEdge.id));
          setSelectedEdge(null);
        } else if (selectedNode) {
          deleteNode(selectedNode.id);
          setSelectedNode(null);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedEdge, selectedNode, setEdges, deleteNode]);

  const generateWorkflowJson = useCallback(() => {
    const workflowSchema = nodes
        .filter((node) => node.type !== 'end')
        .map((node) => {
          const step = {
            id: node.id,
            label: node.data.label,
          };

          switch (node.type) {
            case 'start':
              step.type = 'start';
              break;
            case 'process':
            case 'function':
            case 'response':
              step.type = 'action';
              step.description = node.data.description;
              break;
            case 'glassButton':
              step.type = 'glassButton';
              step.description = node.data.description;
              step.value = node.data.value;
              step.ele = `<button type='button' data-value='${node.data.value}' className='glass-button'>${node.data.text}</button>`;
              break;
            case 'decision':
              step.type = 'decision';
              const outgoingEdges = edges.filter((edge) => edge.source === node.id);
              step.conditions = outgoingEdges.reduce((acc, edge) => {
                acc[edge.sourceHandle] = edge.target;
                return acc;
              }, {});
              break;
            default:
              step.type = 'unknown';
          }

          if (node.type !== 'decision') {
            const outgoingEdges = edges.filter((edge) => edge.source === node.id);
            if (outgoingEdges.length > 0) {
              step.next = outgoingEdges[0].target;
            } else if (node.type !== 'end') {
              step.next = null;
            }
          }

          return step;
        });

    const workflowData = {
      schema: workflowSchema,
    };

    console.log('Workflow JSON:', JSON.stringify(workflowData, null, 2));
    return workflowData;
  }, [nodes, edges]);

  const executeWorkflow = async (userInput) => {
    let currentNodeId = nodes.find(node => node.type === 'start')?.id;
    let chatHistory = [];
    let sessionId = `uuid_${uuidv4()}`;

    while (currentNodeId) {
      const currentNode = nodes.find(node => node.id === currentNodeId);
      if (!currentNode) break;

      chatHistory.push({ type: 'answer', answer: currentNode.data.label, timestamp: new Date() });

      switch (currentNode.type) {
        case 'process':
        case 'function':
        case 'response':
        case 'glassButton':

          chatHistory.push({ type: 'answer', answer: currentNode.data.description || 'No description', timestamp: new Date() });
          currentNodeId = edges.find(edge => edge.source === currentNodeId)?.target;
          break;
        case 'decision':
          const condition = currentNode.data.conditions.find(cond => {
            return userInput.toLowerCase().includes(cond.toLowerCase());
          }) || currentNode.data.conditions[0];
          const nextEdge = edges.find(edge => edge.source === currentNodeId && edge.sourceHandle === condition);
          currentNodeId = nextEdge?.target;
          break;
        case 'end':
          chatHistory.push({ type: 'answer', answer: 'Workflow ended', timestamp: new Date() });
          currentNodeId = null;
          break;
        default:
          currentNodeId = null;
      }
    }

    return { chatHistory, sessionId };
  };

  const importWorkflow = useCallback((jsonString) => {
    try {
      const workflowData = JSON.parse(jsonString);
      if (!workflowData.flow || !Array.isArray(workflowData.flow)) {
        throw new Error('Invalid workflow format');
      }

      const newNodes = [];
      const newEdges = [];
      const xOffset = 250;

      workflowData.flow.forEach((step, index) => {
        const node = {
          id: step.id,
          type: step.type === 'action' ? 'process' : step.type === 'glassButton' ? 'glassButton' : step.type,
          position: { x: index * xOffset, y: 250 },
          data: {
            label: step.label,
            description: step.description || '',
            position: step.position,
            conditions: step.type === 'decision' ? Object.keys(step.conditions || {}) : [],
            jsonConfig: null,
            pageConfig: {
              showPage: false,
              pageUrl: '',
              closeOnAction: false
            }
          },
        };
        newNodes.push(node);

        if (step.type === 'decision' && step.conditions) {
          Object.entries(step.conditions).forEach(([condition, targetId]) => {
            newEdges.push({
              id: `${step.id}-${targetId}`,
              source: step.id,
              target: targetId,
              sourceHandle: condition,
              type: 'step',
            });
          });
        } else if (step.next) {
          newEdges.push({
            id: `${step.id}-${step.next}`,
            source: step.id,
            target: step.next,
            type: 'step',
          });
        }
      });

      setNodes(newNodes);
      setEdges(newEdges);
    } catch (error) {
      console.error('Error importing workflow:', error);
      alert('Error importing workflow: ' + error.message);
    }
  }, [setNodes, setEdges]);

  const saveWorkflow = useCallback(async (customNodes = nodes) => {
    let workflowData = null;
    try {
      setLoading(true);
      setError(null);

      if (!workflowName.trim()) {
        toast.error('لطفا نام گردش کار را وارد کنید');
        setLoading(false);
        return;
      }

      workflowData = {
        name: workflowName.trim(),
        flow: customNodes.map((node) => {
          const step = {
            id: node.id,
            label: node.data.label, // حفظ label برای سازگاری با سرور

            description: node.data.description || null,
            position: node.position,
          };

          switch (node.type) {
            case 'start':
              step.type = 'start';
              break;
            case 'process':
              step.type = 'process';
              break;
            case 'function':
              step.type = 'function';
              step.functionName = node.data.functionData?.name;
              step.functionDescription = node.data.functionData?.description;
              step.functionParameters = node.data.functionData?.parameters;
              break;
            case 'response':
              step.type = 'response';
              break;
            case 'glassButton':
              step.type = 'glassButton';
              // step.value = node.data.value || '';
              // step.text = node.data.text || '';
              step.ele = `<button type='button' data-value='[${node.data.value || ''}]' className='glass-button'>${node.data.text}</button>`;
              break;
            case 'decision':
              step.type = 'decision';
              const outgoingEdges = edges.filter(
                  (edge) => edge.source === node.id && edge.target && node.data.conditions.includes(edge.sourceHandle)
              );
              step.conditions = outgoingEdges.map((edge) => ({
                label: edge.sourceHandle,
                next: edge.target,
              }));
              break;
            case 'end':
              step.type = 'end';
              break;
            default:
              step.type = 'unknown';
          }

          if (node.type !== 'decision' && node.type !== 'end') {
            const outgoingEdges = edges.filter((edge) => edge.source === node.id && edge.target);
            if (outgoingEdges.length > 0) {
              step.next = outgoingEdges[0].target;
            } else {
              step.next = null;
            }
          }

          return step;
        }),
      };

      console.log('Saving workflow data:', JSON.stringify(workflowData, null, 2)); // لاگ برای دیباگ

      let response;
      if (workflowId) {
        response = await workflowEndpoints.updateWorkflow(workflowId, workflowData);
        toast.success('گردش کار با موفقیت بروزرسانی شد');
      } else {
        response = await workflowEndpoints.createWorkflow(workflowData);
        navigate(`/workflow/${response.id}`);
        toast.success('گردش کار با موفقیت ایجاد شد');
      }

      setNodes(customNodes);
      return response; // برای دیباگ
    } catch (err) {
      console.error('Error saving workflow:', err);
      console.error('Error details:', err.response?.data || err.message); // لاگ خطای سرور
      setError('خطا در ذخیره گردش کار: ' + (err.response?.data?.message || err.message));
      toast.error('خطا در ذخیره گردش کار');
      console.log('Workflow Data Sent:', JSON.stringify(workflowData, null, 2));
      throw err; // برای بررسی بیشتر
    } finally {
      setLoading(false);
    }
  }, [nodes, edges, workflowId, workflowName, setNodes, navigate]);
  if (loading) {
    return (
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
    );
  }

  if (error) {
    return (
        <div className="flex items-center justify-center h-screen">
          <div className="text-red-500">{error}</div>
        </div>
    );
  }

  return (
      <div className="h-screen w-full relative" style={{ zIndex: 10 }}>
        <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            rtl={true}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
        />
        <WorkflowEditorSidebar
            workflowName={workflowName}
            setWorkflowName={setWorkflowName}
            workflowId={workflowId}
            saveWorkflow={saveWorkflow}
            addNode={addNode}
            setShowChatModal={setShowChatModal}
        />

        <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onEdgeClick={onEdgeClick}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            fitView
            proOptions={{ hideAttribution: true }}
            style={{ zIndex: 10 }}
        >
          <Controls />
          <MiniMap />
          <Background variant="dots" gap={12} size={1} />
        </ReactFlow>

        {selectedNode && (
            <NodeDetails
                node={selectedNode}
                onUpdate={onNodeUpdate}
                onClose={() => setSelectedNode(null)}
                onDelete={deleteNode}
                saveWorkflow={saveWorkflow}
                nodes={nodes}
                style={{ zIndex: 10 }}
            />
        )}

        {activePage && (
            <PageViewer
                pageConfig={activePage}
                onClose={handlePageClose}
                style={{ zIndex: 10 }}
            />
        )}

        {showFunctionModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center" style={{ zIndex: 10 }}>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4">
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                  انتخاب تابع
                </h3>
                <div className="max-h-96 overflow-y-auto">
                  {aiFunctions.map((func) => (
                      <div
                          key={func.name}
                          className="p-4 border-b border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                          onClick={() => addFunctionNode(func)}
                      >
                        <h4 className="font-medium text-gray-900 dark:text-white">{func.name}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300">{func.description}</p>
                      </div>
                  ))}
                </div>
                <div className="mt-4 flex justify-end">
                  <button
                      onClick={() => setShowFunctionModal(false)}
                      className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                  >
                    انصراف
                  </button>
                </div>
              </div>
            </div>
        )}

        {showDeleteConfirm && selectedNode && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center" style={{ zIndex: 10 }}>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm w-full mx-4">
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                  تایید حذف
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  آیا از حذف این {selectedNode.type === 'start' ? 'شروع' :
                    selectedNode.type === 'process' ? 'فرآیند' :
                        selectedNode.type === 'decision' ? 'تصمیم' :
                            selectedNode.type === 'function' ? 'تابع' :
                                selectedNode.type === 'response' ? 'پاسخ' : 'پایان'} اطمینان دارید؟
                </p>
                <div className="flex justify-end gap-2">
                  <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                  >
                    انصراف
                  </button>
                  <button
                      onClick={() => {
                        deleteNode(selectedNode.id);
                        setSelectedNode(null);
                        setShowDeleteConfirm(false);
                      }}
                      className="px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700"
                  >
                    حذف
                  </button>
                </div>
              </div>
            </div>
        )}

        {showChatModal && (
            <div className="fixed inset-0 flex p-6" style={{ zIndex: 10, pointerEvents: 'none' }}>
              <div
                  className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md h-full flex flex-col justify-between border border-gray-300 dark:border-gray-600"
                  style={{ pointerEvents: 'auto' }}
              >
                <div>
                  <div className="flex justify-end">
                    <button
                        onClick={() => {
                          setShowChatModal(false);
                          window.parent.postMessage({ type: 'SHOW_NAVBAR' }, '*');
                        }}
                        className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
                    >
                      <svg
                          className="w-6 h-6"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                  <div className="overflow-y-auto max-h-[calc(100vh-120px)]">
                    <ChatNoHistory
                        disableHistory={true}
                        onMessage={(message) => {
                          executeWorkflow(message).then(({ chatHistory }) => {
                            if (chatHistory.length > 0) {
                              console.log('Latest response:', chatHistory[chatHistory.length - 1].answer);
                            }
                          });
                        }}
                        onClose={() => {
                          setShowChatModal(false);
                          window.parent.postMessage({ type: 'SHOW_NAVBAR' }, '*');
                        }}
                    />
                  </div>
                </div>
              </div>
            </div>
        )}
      </div>
  );
};

const WorkflowEditor = () => {
  return (
      <ReactFlowProvider>
        <WorkflowEditorContent />
      </ReactFlowProvider>
  );
};

export default WorkflowEditor;