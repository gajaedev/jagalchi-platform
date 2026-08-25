// Canvas sub-feature
export { RoadmapCanvas, JagalchiNode, JagalchiSection, JagalchiText } from './canvas/components';

// Properties sub-feature
export {
  NodePropertiesPanel,
  SectionPropertiesPanel,
  TextPropertiesPanel,
  EdgePropertiesPanel,
  ColorPicker,
  ColorSelector,
  ColorPresetButton,
} from './properties/components';

// Sidebar sub-feature
export { EditorSidebar, MultiSelectPanel } from './sidebar/components';

// Toolbar sub-feature
export { EditorToolbar, ToolbarButton } from './toolbar/components';

// Core sub-feature
export { EditorHeader, RoadmapEditor } from './core/components';

// Hooks
export { useCanvasCenter } from './hooks/use-canvas-center';

// Stores
export {
  nodesAtom,
  edgesAtom,
  roadmapTitleAtom,
  selectedNodeIdsAtom,
  selectedEdgeIdsAtom,
  selectedNodesAtom,
  selectedEdgesAtom,
  singleSelectedNodeAtom,
  singleSelectedEdgeAtom,
  isColorPickerOpenAtom,
  colorPickerTargetAtom,
  activeToolAtom,
} from './stores/editor-atoms';

// Types
export type {
  NodeColorVariant,
  TextColorVariant,
  NodeState,
  JagalchiNodeData,
  JagalchiSectionData,
  JagalchiTextData,
  JagalchiNodeType,
  JagalchiSectionType,
  JagalchiTextType,
  RoadmapNode,
} from './types/editor.types';

// Utils
export {
  createJagalchiNode,
  createJagalchiSection,
  createJagalchiText,
} from './utils/node-factory';
export { alignNodes } from './utils/align-nodes';
export type { AlignDirection } from './utils/align-nodes';

// Constants
export { getNodeColors, getTextColor } from './constants/node-colors';
export {
  NODE_PRESET_COLORS,
  TEXT_PRESET_COLORS,
  hexToNodeVariant,
  hexToTextVariant,
  nodeVariantToHex,
  textVariantToHex,
} from './constants/preset-colors';
