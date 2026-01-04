/* ========= Root ========= */

export interface AnalyzeResponse {
  status: "ok" | "error";
  environment: EnvironmentInfo;
  stages: StagesMap;
}

/* ========= Environment ========= */

export interface EnvironmentInfo {
  os: string;
  release: string;
  machine: string;
  processor: string;
  python_version: string;
}

/* ========= Stages ========= */

export type StagesMap = {
  lexical?: LexicalStage;
  syntax?: SyntaxStage;
  semantic?: SemanticStage;
  ir?: IRStage;
  optimization?: OptimizationStage;
  assembly?: AssemblyStage;
  machine_code?: MachineCodeStage;
  // future stages allowed
  [key: string]: StageBase | undefined;
};

export interface StageBase {
  order: number;
  stage: string;
  status: "ok" | "error";
  diagnostics: Diagnostics;
}

/* ========= Diagnostics ========= */

export interface Diagnostics {
  errors: DiagnosticMessage[];
  warnings: DiagnosticMessage[];
}

export interface DiagnosticMessage {
  message: string;
  line?: number;
  column?: number;
}

/* ========= Lexical ========= */

export interface LexicalStage extends StageBase {
  stage: "lexical";
  token_count: number;
  output: {
    tokens: Token[];
  };
}

export interface Token {
  kind: string;
  value: string;
  line: number;
  column: number;
}

/* ========= Syntax ========= */

export interface SyntaxStage extends StageBase {
  stage: "syntax";
  output: {
    ast: ASTNode;
  };
}

/* AST is intentionally loose — clang AST is huge and unstable */
export interface ASTNode {
  id?: string;
  kind: string;
  loc?: Record<string, unknown>;
  range?: Record<string, unknown>;
  inner?: ASTNode[];
  [key: string]: any;
}

/* ========= Semantic ========= */

export interface SemanticStage extends StageBase {
  stage: "semantic";
  output: {
    valid: boolean;
    summary: string;
  };
}

/* ========= IR ========= */

export interface IRStage extends StageBase {
  stage: "ir";
  output: {
    ir: string;
    module: {
      source_filename: string;
      target_triple: string;
    };
    attributes: Record<string, IRAttribute>;
    debug?: {
      language: string;
      producer: string;
    };
  };
}

export interface IRAttribute {
  flags: string[];
  key_values: Record<string, string>;
}

/* ========= Optimization ========= */

export interface OptimizationStage extends StageBase {
  stage: "optimization";
  output: {
    ir_optimized: string;
  };
}

/* ========= Assembly ========= */

export interface AssemblyStage extends StageBase {
  stage: "assembly";
  output: {
    assembly: string;
  };
}

/* ========= Machine Code ========= */

export interface MachineCodeStage extends StageBase {
  stage: "machine_code";
  output: {
    disassembly: string;
    parsed_dissembley_code: ParsedDisassembly;
  };
}

export interface ParsedDisassembly {
  file: string;
  format: string;
  section: string;
  functions: DisassembledFunction[];
}

export interface DisassembledFunction {
  name: string;
  address: string;
  instructions: Instruction[];
}

export interface Instruction {
  address: string;
  bytes: string[];
  mnemonic: string;
  operands: string[];
}
