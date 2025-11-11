import React, { useState, useEffect } from 'react';
import { X, GitBranch, User, Search, ChevronDown, ChevronRight, Mail, Phone, Briefcase, Building2, Sparkles, Download, Layout, Grid, List, BarChart2, Users as UsersIcon, TrendingUp, Move, Eye, FileText, Image, Presentation } from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import { useAuthContext } from '../../contexts/AuthContext';
import { mockOrgChartEmployees, type MockEmployee } from '../../data/mockOrgChartEmployees';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface OrgChartModalProps {
  onClose?: () => void;
}

interface Employee {
  id: string;
  name: string;
  title: string;
  department: string;
  email: string;
  phone: string;
  photo: string;
  managerId?: string;
  reports?: Employee[];
}

interface OrgNode {
  id: string;
  name: string;
  title: string;
  department: string;
  email: string;
  phone: string;
  photo: string;
  children: OrgNode[];
  level: number;
}

type ViewMode = 'flowchart' | 'tree' | 'grid' | 'compact';
type ColorMode = 'department' | 'level' | 'none';

const OrgChartModal: React.FC<OrgChartModalProps> = ({ onClose }) => {
  const { user } = useAuthContext();
  const [orgData, setOrgData] = useState<OrgNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [selectedEmployee, setSelectedEmployee] = useState<OrgNode | null>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('flowchart');
  const [colorMode, setColorMode] = useState<ColorMode>('department');
  const [showStats, setShowStats] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [draggedNode, setDraggedNode] = useState<OrgNode | null>(null);
  const [zoomLevel, setZoomLevel] = useState(70);
  const chartRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkAccess();
  }, [user]);

  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && onClose) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscKey);
    return () => document.removeEventListener('keydown', handleEscKey);
  }, [onClose]);

  const checkAccess = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('department, role, can_access_org_chart')
        .eq('id', user.id)
        .maybeSingle();

      if (error) throw error;

      const hasOrgChartAccess =
        data?.department === 'HR' ||
        data?.role === 'Product Owner' ||
        data?.can_access_org_chart === true;

      setHasAccess(hasOrgChartAccess);

      if (hasOrgChartAccess) {
        loadOrgChart();
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('Error checking access:', error);
      setLoading(false);
    }
  };

  const loadOrgChart = async () => {
    try {
      const employees = mockOrgChartEmployees.map((emp: MockEmployee) => ({
        id: emp.id,
        name: emp.name,
        title: emp.title,
        department: emp.department,
        email: emp.email,
        phone: emp.phone,
        photo: emp.photo,
        managerId: emp.managerId
      }));

      const orgTree = buildOrgTree(employees);
      setOrgData(orgTree);

      if (orgTree.length > 0) {
        const rootIds = new Set(orgTree.map(node => node.id));
        setExpandedNodes(rootIds);
      }
    } catch (error) {
      console.error('Error loading org chart:', error);
    } finally {
      setLoading(false);
    }
  };

  const buildOrgTree = (employees: any[]): OrgNode[] => {
    const employeeMap = new Map<string, OrgNode>();

    employees.forEach(emp => {
      employeeMap.set(emp.id, {
        ...emp,
        children: [],
        level: 0
      });
    });

    const roots: OrgNode[] = [];

    employees.forEach(emp => {
      const node = employeeMap.get(emp.id)!;

      if (emp.managerId) {
        const manager = employeeMap.get(emp.managerId);
        if (manager) {
          manager.children.push(node);
          node.level = manager.level + 1;
        } else {
          roots.push(node);
        }
      } else {
        roots.push(node);
      }
    });

    const sortByName = (a: OrgNode, b: OrgNode) => a.name.localeCompare(b.name);
    roots.forEach(root => sortChildren(root, sortByName));

    return roots.sort(sortByName);
  };

  const sortChildren = (node: OrgNode, compareFn: (a: OrgNode, b: OrgNode) => number) => {
    node.children.sort(compareFn);
    node.children.forEach(child => sortChildren(child, compareFn));
  };

  const toggleNode = (nodeId: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };

  const searchInTree = (nodes: OrgNode[], term: string): OrgNode[] => {
    if (!term) return nodes;

    const lowerTerm = term.toLowerCase();
    const results: OrgNode[] = [];

    const aiKeywords = {
      leadership: ['ceo', 'cfo', 'cto', 'coo', 'cmo', 'vp', 'director', 'chief', 'head', 'lead'],
      engineering: ['engineer', 'developer', 'devops', 'software', 'backend', 'frontend', 'fullstack', 'full stack', 'technical', 'qa', 'mobile'],
      management: ['manager', 'lead', 'supervisor', 'coordinator', 'head'],
      sales: ['sales', 'account executive', 'business development', 'revenue', 'rep'],
      seniority: ['senior', 'junior', 'associate', 'principal', 'staff'],
      location: ['san francisco', 'new york', 'remote', 'sf', 'ny']
    };

    const matchesAICategory = (node: OrgNode): boolean => {
      for (const [category, keywords] of Object.entries(aiKeywords)) {
        if (keywords.some(keyword => lowerTerm.includes(keyword))) {
          return keywords.some(keyword =>
            node.title.toLowerCase().includes(keyword) ||
            node.department.toLowerCase().includes(keyword)
          );
        }
      }
      return false;
    };

    const search = (node: OrgNode): boolean => {
      const textMatches =
        node.name.toLowerCase().includes(lowerTerm) ||
        node.title.toLowerCase().includes(lowerTerm) ||
        node.department.toLowerCase().includes(lowerTerm) ||
        node.email.toLowerCase().includes(lowerTerm);

      const aiMatches = matchesAICategory(node);
      const childMatches = node.children.map(child => search(child)).some(Boolean);

      if (textMatches || aiMatches || childMatches) {
        const filteredNode = { ...node, children: [] };
        if (childMatches) {
          filteredNode.children = node.children.filter(child => search(child));
        } else {
          filteredNode.children = node.children;
        }
        results.push(filteredNode);
        return true;
      }

      return false;
    };

    nodes.forEach(node => search(node));
    return results;
  };

  const getDepartmentColor = (department: string) => {
    const colors: Record<string, string> = {
      'Engineering': 'from-blue-500 to-blue-600',
      'Product': 'from-purple-500 to-purple-600',
      'Design': 'from-pink-500 to-pink-600',
      'Marketing': 'from-orange-500 to-orange-600',
      'Sales': 'from-green-500 to-green-600',
      'HR': 'from-red-500 to-red-600',
      'Finance': 'from-emerald-500 to-emerald-600',
      'Operations': 'from-yellow-500 to-yellow-600',
      'Customer Success': 'from-teal-500 to-teal-600',
    };
    return colors[department] || 'from-gray-500 to-gray-600';
  };

  const getLevelColor = (level: number) => {
    const colors = [
      'from-purple-500 to-purple-600',
      'from-blue-500 to-blue-600',
      'from-green-500 to-green-600',
      'from-yellow-500 to-yellow-600',
      'from-orange-500 to-orange-600',
    ];
    return colors[Math.min(level, colors.length - 1)];
  };

  const getNodeColor = (node: OrgNode) => {
    if (colorMode === 'department') return getDepartmentColor(node.department);
    if (colorMode === 'level') return getLevelColor(node.level);
    return 'from-blue-500 to-emerald-500';
  };

  const calculateStats = () => {
    const allNodes: OrgNode[] = [];
    const traverse = (nodes: OrgNode[]) => {
      nodes.forEach(node => {
        allNodes.push(node);
        traverse(node.children);
      });
    };
    traverse(orgData);

    const deptCounts: Record<string, number> = {};
    const levelCounts: Record<number, number> = {};

    allNodes.forEach(node => {
      deptCounts[node.department] = (deptCounts[node.department] || 0) + 1;
      levelCounts[node.level] = (levelCounts[node.level] || 0) + 1;
    });

    return {
      totalEmployees: allNodes.length,
      departments: Object.keys(deptCounts).length,
      deptCounts,
      levelCounts,
      avgTeamSize: allNodes.length > 0 ? (allNodes.reduce((sum, n) => sum + n.children.length, 0) / allNodes.length).toFixed(1) : '0'
    };
  };

  const exportToPDF = async () => {
    if (!chartRef.current) return;

    const canvas = await html2canvas(chartRef.current);
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('l', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save('org-chart.pdf');
    setShowExportMenu(false);
  };

  const exportToPNG = async () => {
    if (!chartRef.current) return;

    const canvas = await html2canvas(chartRef.current);
    const link = document.createElement('a');
    link.download = 'org-chart.png';
    link.href = canvas.toDataURL();
    link.click();
    setShowExportMenu(false);
  };

  const handleDragStart = (e: React.DragEvent, node: OrgNode) => {
    setDraggedNode(node);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetNode: OrgNode) => {
    e.preventDefault();
    if (!draggedNode || draggedNode.id === targetNode.id) return;

    alert(`In a full implementation, ${draggedNode.name} would be moved to report to ${targetNode.name}. This would update the database and refresh the org chart.`);
    setDraggedNode(null);
  };

  const renderNode = (node: OrgNode) => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children.length > 0;

    return (
      <div key={node.id} className="ml-6">
        <div
          draggable
          onDragStart={(e) => handleDragStart(e, node)}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, node)}
          className={`flex items-center p-3 mb-2 rounded-lg border transition-all cursor-move ${
            selectedEmployee?.id === node.id
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-md'
          } ${draggedNode?.id === node.id ? 'opacity-50' : ''}`}
          onClick={() => setSelectedEmployee(node)}
        >
          <div className="flex items-center flex-1">
            {hasChildren && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleNode(node.id);
                }}
                className="mr-2 p-1 hover:bg-gray-100 rounded transition-colors"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                )}
              </button>
            )}
            {!hasChildren && <div className="w-6 mr-2" />}

            <div className={`h-10 w-10 rounded-full bg-gradient-to-br ${getNodeColor(node)} flex items-center justify-center text-white font-semibold mr-3 flex-shrink-0`}>
              {node.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
            </div>

            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-gray-900 dark:text-white dark:text-white truncate">{node.name}</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{node.title}</p>
            </div>

            <div className="ml-3 flex items-center space-x-2">
              <span className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-medium">
                {node.department}
              </span>
              {hasChildren && (
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                  {node.children.length} {node.children.length === 1 ? 'Report' : 'Reports'}
                </span>
              )}
              <Move className="h-4 w-4 text-gray-400" />
            </div>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div className="ml-4 border-l-2 border-gray-200 dark:border-gray-700 dark:border-gray-700 pl-2">
            {node.children.map(child => renderNode(child))}
          </div>
        )}
      </div>
    );
  };

  const renderGridView = (nodes: OrgNode[]) => {
    const allNodes: OrgNode[] = [];
    const traverse = (nodeList: OrgNode[]) => {
      nodeList.forEach(node => {
        allNodes.push(node);
        traverse(node.children);
      });
    };
    traverse(nodes);

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {allNodes.map(node => (
          <div
            key={node.id}
            draggable
            onDragStart={(e) => handleDragStart(e, node)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, node)}
            onClick={() => setSelectedEmployee(node)}
            className={`p-4 rounded-lg border cursor-move transition-all ${
              selectedEmployee?.id === node.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-lg'
            }`}
          >
            <div className="text-center">
              <div className={`h-16 w-16 rounded-full bg-gradient-to-br ${getNodeColor(node)} flex items-center justify-center text-white font-bold text-xl mx-auto mb-3`}>
                {node.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
              </div>
              <h4 className="font-semibold text-gray-900 dark:text-white dark:text-white mb-1">{node.name}</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{node.title}</p>
              <span className="inline-block px-2 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-medium">
                {node.department}
              </span>
              {node.children.length > 0 && (
                <p className="text-xs text-gray-500 mt-2">{node.children.length} direct reports</p>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderCompactView = (nodes: OrgNode[]) => {
    const allNodes: OrgNode[] = [];
    const traverse = (nodeList: OrgNode[]) => {
      nodeList.forEach(node => {
        allNodes.push(node);
        traverse(node.children);
      });
    };
    traverse(nodes);

    return (
      <div className="space-y-1">
        {allNodes.map(node => (
          <div
            key={node.id}
            draggable
            onDragStart={(e) => handleDragStart(e, node)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, node)}
            onClick={() => setSelectedEmployee(node)}
            className={`flex items-center p-2 rounded-lg border cursor-move transition-all ${
              selectedEmployee?.id === node.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-blue-300'
            }`}
          >
            <div className={`h-8 w-8 rounded-full bg-gradient-to-br ${getNodeColor(node)} flex items-center justify-center text-white font-semibold text-xs mr-3`}>
              {node.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm text-gray-900 dark:text-white dark:text-white truncate">{node.name}</h4>
              <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{node.title}</p>
            </div>
            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-xs font-medium ml-2">
              {node.department}
            </span>
          </div>
        ))}
      </div>
    );
  };

  const renderFlowchartNode = (node: OrgNode, isRoot: boolean = false) => {
    const cardWidth = 140;
    const headerHeight = 40;
    const avatarSize = 48;
    const connectorHeight = 16;
    const gap = 16;

    return (
      <div key={node.id} className="flex flex-col items-center">
        <div
          draggable
          onDragStart={(e) => handleDragStart(e, node)}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, node)}
          onClick={() => setSelectedEmployee(node)}
          className={`relative bg-white rounded-lg border-2 cursor-move transition-all shadow-md hover:shadow-lg ${
            selectedEmployee?.id === node.id
              ? 'border-blue-500 ring-2 ring-blue-200'
              : 'border-gray-200 hover:border-blue-300'
          } ${draggedNode?.id === node.id ? 'opacity-50' : ''}`}
          style={{ width: `${cardWidth}px` }}
        >
          <div className={`bg-gradient-to-r ${getNodeColor(node)} rounded-t-lg flex items-center justify-center relative`} style={{ height: `${headerHeight}px` }}>
            <div
              className={`absolute border-2 border-white bg-gradient-to-br ${getNodeColor(node)} rounded-full flex items-center justify-center text-white font-bold shadow-md`}
              style={{
                width: `${avatarSize}px`,
                height: `${avatarSize}px`,
                bottom: `-${avatarSize / 2}px`,
                fontSize: '14px'
              }}
            >
              {node.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
            </div>
          </div>
          <div className="text-center" style={{ paddingTop: `${avatarSize / 2 + 8}px`, paddingBottom: '12px', paddingLeft: '8px', paddingRight: '8px' }}>
            <h3 className="font-semibold text-gray-900 dark:text-white dark:text-white mb-0.5 text-xs truncate">{node.name}</h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1.5 truncate" style={{ fontSize: '10px' }}>{node.title}</p>
            <span className="inline-block px-1.5 py-0.5 bg-gray-100 text-gray-700 dark:text-gray-300 dark:text-gray-300 rounded-full font-medium" style={{ fontSize: '9px' }}>
              {node.department}
            </span>
          </div>
        </div>

        {node.children.length > 0 && (
          <div className="flex flex-col items-center" style={{ marginTop: `${connectorHeight}px` }}>
            <div className="bg-gray-300" style={{ height: `${connectorHeight}px`, width: '2px' }}></div>
            <div className="flex relative" style={{ gap: `${gap}px` }}>
              {node.children.length > 1 && (
                <div className="absolute left-0 right-0 bg-gray-300" style={{ top: '0', height: '2px' }}></div>
              )}
              {node.children.map((child, index) => (
                <div key={child.id} className="flex flex-col items-center">
                  <div className="bg-gray-300" style={{ height: `${connectorHeight}px`, width: '2px' }}></div>
                  {renderFlowchartNode(child, false)}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderFlowchartView = (nodes: OrgNode[]) => {
    return (
      <div
        className="flex justify-center items-start min-h-full py-8 transition-transform origin-top"
        style={{ transform: `scale(${zoomLevel / 100})` }}
      >
        <div className="flex" style={{ gap: '32px' }}>
          {nodes.map(node => renderFlowchartNode(node, true))}
        </div>
      </div>
    );
  };

  const filteredOrgData = searchTerm ? searchInTree(orgData, searchTerm) : orgData;
  const stats = calculateStats();

  if (!hasAccess && !loading) {
    return (
      <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-lg w-full h-full overflow-auto">
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-600 to-emerald-600 text-white">
          <div className="flex items-center">
            <GitBranch className="h-8 w-8 mr-3" />
            <div>
              <h2 className="text-2xl font-bold">Organization Chart</h2>
              <p className="text-blue-100">Company hierarchy and reporting structure</p>
            </div>
          </div>
          {onClose && (
            <button onClick={onClose} className="text-blue-100 hover:text-white transition-colors p-2 rounded-lg hover:bg-white dark:bg-gray-800 dark:bg-gray-800/20">
              <X className="h-6 w-6" />
            </button>
          )}
        </div>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <GitBranch className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white dark:text-white mb-2">Access Denied</h3>
            <p className="text-gray-600 dark:text-gray-400 max-w-md">
              You do not have permission to view the organization chart. Contact your HR department or administrator to request access.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-lg w-full h-full overflow-hidden flex flex-col">
      <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-600 to-emerald-600 text-white flex-shrink-0">
        <div className="flex items-center">
          <GitBranch className="h-8 w-8 mr-3" />
          <div>
            <h2 className="text-2xl font-bold">Organization Chart</h2>
            <p className="text-blue-100">Interactive company hierarchy with drag-and-drop</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowStats(!showStats)}
            className="flex items-center gap-2 px-3 py-2 bg-white/20 hover:bg-white dark:bg-gray-800 dark:bg-gray-800/30 rounded-lg transition-colors"
          >
            <BarChart2 className="h-4 w-4" />
            <span className="text-sm">Stats</span>
          </button>
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center gap-2 px-3 py-2 bg-white/20 hover:bg-white dark:bg-gray-800 dark:bg-gray-800/30 rounded-lg transition-colors"
            >
              <Download className="h-4 w-4" />
              <span className="text-sm">Export</span>
            </button>
            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 dark:border-gray-700 py-2 z-10">
                <button
                  onClick={exportToPDF}
                  className="w-full px-4 py-2 text-left text-gray-700 dark:text-gray-300 dark:text-gray-300 hover:bg-gray-50 dark:bg-gray-900 flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  Export as PDF
                </button>
                <button
                  onClick={exportToPNG}
                  className="w-full px-4 py-2 text-left text-gray-700 dark:text-gray-300 dark:text-gray-300 hover:bg-gray-50 dark:bg-gray-900 flex items-center gap-2"
                >
                  <Image className="h-4 w-4" />
                  Export as PNG
                </button>
                <button
                  onClick={() => {
                    alert('PowerPoint export would generate a .pptx file with the org chart in a full implementation.');
                    setShowExportMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-gray-700 dark:text-gray-300 dark:text-gray-300 hover:bg-gray-50 dark:bg-gray-900 flex items-center gap-2"
                >
                  <Presentation className="h-4 w-4" />
                  Export as PowerPoint
                </button>
              </div>
            )}
          </div>
          {onClose && (
            <button onClick={onClose} className="text-blue-100 hover:text-white transition-colors p-2 rounded-lg hover:bg-white dark:bg-gray-800 dark:bg-gray-800/20">
              <X className="h-6 w-6" />
            </button>
          )}
        </div>
      </div>

      {showStats && (
        <div className="p-4 bg-gradient-to-r from-blue-50 to-emerald-50 border-b">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-1">
                <UsersIcon className="h-4 w-4 text-blue-600" />
                <span className="text-xs text-gray-600 dark:text-gray-400">Total Employees</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white dark:text-white">{stats.totalEmployees}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-1">
                <Building2 className="h-4 w-4 text-emerald-600" />
                <span className="text-xs text-gray-600 dark:text-gray-400">Departments</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white dark:text-white">{stats.departments}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-purple-600" />
                <span className="text-xs text-gray-600 dark:text-gray-400">Avg Team Size</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white dark:text-white">{stats.avgTeamSize}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-1">
                <GitBranch className="h-4 w-4 text-orange-600" />
                <span className="text-xs text-gray-600 dark:text-gray-400">Org Levels</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white dark:text-white">{Object.keys(stats.levelCounts).length}</p>
            </div>
          </div>
        </div>
      )}

      <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-emerald-50 flex-shrink-0">
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-2 bg-white dark:bg-gray-800 dark:bg-gray-800 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 dark:border-gray-700">
            <Layout className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value as ViewMode)}
              className="text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 bg-transparent border-none focus:ring-0 cursor-pointer"
            >
              <option value="flowchart">Flowchart View</option>
              <option value="tree">Tree View</option>
              <option value="grid">Grid View</option>
              <option value="compact">Compact View</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-white dark:bg-gray-800 dark:bg-gray-800 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 dark:border-gray-700">
            <Eye className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            <select
              value={colorMode}
              onChange={(e) => setColorMode(e.target.value as ColorMode)}
              className="text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 bg-transparent border-none focus:ring-0 cursor-pointer"
            >
              <option value="department">Color by Department</option>
              <option value="level">Color by Level</option>
              <option value="none">Default Colors</option>
            </select>
          </div>

          {viewMode === 'flowchart' && (
            <div className="flex items-center gap-3 bg-white dark:bg-gray-800 dark:bg-gray-800 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 dark:border-gray-700">
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 whitespace-nowrap">Zoom</span>
              <input
                type="range"
                min="30"
                max="150"
                value={zoomLevel}
                onChange={(e) => setZoomLevel(Number(e.target.value))}
                className="w-32 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 w-10">{zoomLevel}%</span>
            </div>
          )}
        </div>

        <div className="relative">
          <div className="relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 flex items-center">
              <div className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-full p-1 mr-2 animate-pulse">
                <Sparkles className="h-3 w-3 text-white" />
              </div>
              <span className="text-xs font-medium text-purple-600">AI</span>
            </div>
            <input
              type="text"
              placeholder="AI Search: Try 'Sarah', 'Engineering', 'San Francisco', 'Manager', etc..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-16 pr-4 py-2.5 border-2 border-purple-100 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-300 bg-purple-50 dark:bg-purple-900/20/50 placeholder-gray-500 transition-all duration-200"
            />
          </div>
          <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
            Drag and drop employees to reorganize • Smart search understands: names, titles, departments, seniority levels, and more
          </p>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div ref={chartRef} className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Loading organization chart...</p>
            </div>
          ) : filteredOrgData.length === 0 ? (
            <div className="text-center py-12">
              <GitBranch className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No employees found</p>
            </div>
          ) : (
            <div>
              {viewMode === 'flowchart' && renderFlowchartView(filteredOrgData)}
              {viewMode === 'tree' && filteredOrgData.map(node => renderNode(node))}
              {viewMode === 'grid' && renderGridView(filteredOrgData)}
              {viewMode === 'compact' && renderCompactView(filteredOrgData)}
            </div>
          )}
        </div>

        {selectedEmployee && (
          <div className="w-80 border-l bg-gray-50 dark:bg-gray-900 p-6 overflow-y-auto flex-shrink-0">
            <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 dark:border-gray-700">
              <div className="text-center mb-6">
                <div className={`h-24 w-24 rounded-full bg-gradient-to-br ${getNodeColor(selectedEmployee)} flex items-center justify-center text-white font-bold text-3xl mx-auto mb-4`}>
                  {selectedEmployee.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white dark:text-white mb-1">{selectedEmployee.name}</h3>
                <p className="text-gray-600 dark:text-gray-400 font-medium">{selectedEmployee.title}</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center text-sm">
                  <Building2 className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0" />
                  <div>
                    <p className="text-gray-500 text-xs">Department</p>
                    <p className="text-gray-900 dark:text-white dark:text-white font-medium">{selectedEmployee.department}</p>
                  </div>
                </div>

                {selectedEmployee.email && (
                  <div className="flex items-center text-sm">
                    <Mail className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0" />
                    <div>
                      <p className="text-gray-500 text-xs">Email</p>
                      <a href={`mailto:${selectedEmployee.email}`} className="text-blue-600 hover:underline break-all">
                        {selectedEmployee.email}
                      </a>
                    </div>
                  </div>
                )}

                {selectedEmployee.phone && (
                  <div className="flex items-center text-sm">
                    <Phone className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0" />
                    <div>
                      <p className="text-gray-500 text-xs">Phone</p>
                      <a href={`tel:${selectedEmployee.phone}`} className="text-blue-600 hover:underline">
                        {selectedEmployee.phone}
                      </a>
                    </div>
                  </div>
                )}

                <div className="flex items-center text-sm">
                  <GitBranch className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0" />
                  <div>
                    <p className="text-gray-500 text-xs">Organization Level</p>
                    <p className="text-gray-900 dark:text-white dark:text-white font-medium">Level {selectedEmployee.level + 1}</p>
                  </div>
                </div>

                {selectedEmployee.children.length > 0 && (
                  <div className="pt-4 border-t">
                    <p className="text-gray-500 text-xs mb-2">Direct Reports ({selectedEmployee.children.length})</p>
                    <div className="space-y-2">
                      {selectedEmployee.children.map(child => (
                        <div
                          key={child.id}
                          className="flex items-center p-2 bg-gray-50 dark:bg-gray-900 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                          onClick={() => setSelectedEmployee(child)}
                        >
                          <div className={`h-8 w-8 rounded-full bg-gradient-to-br ${getNodeColor(child)} flex items-center justify-center text-white font-semibold text-xs mr-2`}>
                            {child.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white dark:text-white truncate">{child.name}</p>
                            <p className="text-xs text-gray-500 truncate">{child.title}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrgChartModal;
