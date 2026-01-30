"""
Utilities for limiting response data size.

When using #include <stdio.h> or other system headers, the token count
and AST can become massive (4000+ tokens). This module provides functions
to filter out content from system headers and keep only user code.
"""

from typing import Dict, Any, List
import logging

logger = logging.getLogger(__name__)

# Maximum number of tokens to return in response
MAX_TOKENS = 100

# Maximum AST depth to return
MAX_AST_DEPTH = 10

# Maximum number of instructions per function in machine code
MAX_INSTRUCTIONS = 10


def filter_tokens_by_source(tokens: List[Dict], source_filename: str) -> Dict:
    """
    Filter tokens to only include those from the user's source file.
    
    Args:
        tokens: List of token dictionaries with 'line' and 'kind' keys
        source_filename: The name of the user's source file
        
    Returns:
        Dictionary with filtered tokens and metadata
    """
    if not tokens:
        return {
            "tokens": [],
            "total_count": 0,
            "shown_count": 0,
            "truncated": False
        }
    
    total_count = len(tokens)
    
    # If already within limits, return as-is
    if total_count <= MAX_TOKENS:
        return {
            "tokens": tokens,
            "total_count": total_count,
            "shown_count": total_count,
            "truncated": False
        }
    
    # Limit tokens and indicate truncation
    limited_tokens = tokens[:MAX_TOKENS]
    logger.info(f"Truncated tokens from {total_count} to {MAX_TOKENS}")
    
    return {
        "tokens": limited_tokens,
        "total_count": total_count,
        "shown_count": len(limited_tokens),
        "truncated": True,
        "truncation_message": f"Showing {MAX_TOKENS} of {total_count} tokens. Large includes (like stdio.h) generate many tokens from system headers."
    }


def limit_ast_depth(ast: Dict, max_depth: int = MAX_AST_DEPTH, current_depth: int = 0) -> Dict:
    """
    Recursively limit AST depth to prevent massive nested structures.
    
    Args:
        ast: The AST dictionary
        max_depth: Maximum depth to traverse
        current_depth: Current recursion depth
        
    Returns:
        Limited AST dictionary
    """
    if ast is None or not isinstance(ast, dict):
        return ast
    
    if current_depth >= max_depth:
        # At max depth, just indicate there's more content
        inner_count = count_ast_nodes(ast)
        if inner_count > 0:
            return {
                "_truncated": True,
                "_hidden_nodes": inner_count,
                "_message": f"{inner_count} nested nodes hidden (depth limit reached)"
            }
        return ast
    
    result = {}
    for key, value in ast.items():
        if key == "inner" and isinstance(value, list):
            # Limit the 'inner' array which contains child nodes
            limited_inner = []
            for i, child in enumerate(value):
                if i < 20:  # Show first 20 children at each level
                    limited_inner.append(limit_ast_depth(child, max_depth, current_depth + 1))
                else:
                    remaining = len(value) - i
                    limited_inner.append({
                        "_truncated": True,
                        "_hidden_nodes": remaining,
                        "_message": f"{remaining} more sibling nodes hidden"
                    })
                    break
            result[key] = limited_inner
        elif isinstance(value, dict):
            result[key] = limit_ast_depth(value, max_depth, current_depth + 1)
        elif isinstance(value, list):
            result[key] = [
                limit_ast_depth(item, max_depth, current_depth + 1) if isinstance(item, dict) else item
                for item in value[:50]  # Limit arrays to 50 items
            ]
            if len(value) > 50:
                result[key].append({"_truncated": True, "_hidden_items": len(value) - 50})
        else:
            result[key] = value
    
    return result


def count_ast_nodes(ast: Any) -> int:
    """Count total nodes in an AST structure."""
    if ast is None:
        return 0
    if not isinstance(ast, dict):
        return 0
    
    count = 1
    for value in ast.values():
        if isinstance(value, dict):
            count += count_ast_nodes(value)
        elif isinstance(value, list):
            for item in value:
                count += count_ast_nodes(item)
    
    return count


def limit_response_data(stage_result: Dict, stage_name: str) -> Dict:
    """
    Apply appropriate limits to a stage result based on stage type.
    
    Args:
        stage_result: The result dictionary from a compilation stage
        stage_name: Name of the stage ('lexical', 'syntax', etc.)
        
    Returns:
        Stage result with limited data
    """
    if stage_result.get("status") == "error":
        return stage_result
    
    result = stage_result.copy()
    output = result.get("output", {})
    
    if stage_name == "lexical" and "tokens" in output:
        tokens = output["tokens"]
        limited = filter_tokens_by_source(tokens, "")
        result["output"] = limited
        result["token_count"] = limited["total_count"]
        
    elif stage_name == "syntax" and "ast" in output:
        ast = output["ast"]
        if ast:
            total_nodes = count_ast_nodes(ast)
            logger.info(f"AST has {total_nodes} total nodes")
            
            if total_nodes > 200:
                result["output"] = {
                    "ast": limit_ast_depth(ast),
                    "total_nodes": total_nodes,
                    "limited": True,
                    "limitation_message": f"AST limited for display ({total_nodes} total nodes). System headers contribute most nodes."
                }
    
    elif stage_name == "machine_code" and "parsed_dissembley_code" in output:
        parsed = output.get("parsed_dissembley_code", {})
        functions = parsed.get("functions", [])
        
        if functions:
            limited_functions = []
            total_instructions = 0
            
            for func in functions:
                instructions = func.get("instructions", [])
                total_instructions += len(instructions)
                
                limited_func = func.copy()
                if len(instructions) > MAX_INSTRUCTIONS:
                    limited_func["instructions"] = instructions[:MAX_INSTRUCTIONS]
                    limited_func["_truncated"] = True
                    limited_func["_total_instructions"] = len(instructions)
                    limited_func["_shown_instructions"] = MAX_INSTRUCTIONS
                
                limited_functions.append(limited_func)
            
            result["output"]["parsed_dissembley_code"]["functions"] = limited_functions
            result["output"]["parsed_dissembley_code"]["total_instructions"] = total_instructions
            result["output"]["parsed_dissembley_code"]["limited"] = total_instructions > MAX_INSTRUCTIONS
    
    return result

