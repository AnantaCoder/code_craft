# API Documentation

## POST /api/analyze/lexical

Request:

```json
{
  "code": "int main(){ return 0; }"
}
```

Success Response:

```json
{
  "order": 1,
  "stage": "lexical",
  "status": "ok",
  "token_count": 1,
  "output": {
    "tokens": [
      {
        "kind": "identifier",
        "value": "main",
        "line": 1,
        "column": 5
      }
    ]
  },
  "diagnostics": {
    "errors": [],
    "warnings": []
  },
  "raw": "...clang token dump..."
}
```

## POST /api/analyze/syntax

Request:

```json
{
  "code": "int main(){ return 0; }"
}
```

Success Response:

```json
{
  "order": 2,
  "stage": "syntax",
  "status": "ok",
  "output": {
    "ast": {
      "kind": "TranslationUnitDecl",
      "loc": {},
      "range": {},
      "inner": [...]
    }
  },
  "diagnostics": {
    "errors": [],
    "warnings": []
  }
}
```

Failure Response:

```json
{
  "order": 2,
  "stage": "syntax",
  "status": "error",
  "output": {
    "ast": null
  },
  "diagnostics": {
    "errors": [
      {
        "message": "syntax error message"
      }
    ],
    "warnings": []
  }
}
```

## POST /api/analyze/semantic

Request:

```json
{
  "code": "int main(void) { int x = 5; return x; }"
}
```

Success Response:

```json
{
  "order": 3,
  "stage": "semantic",
  "status": "ok",
  "output": {
    "valid": true,
    "summary": "Semantic analysis completed successfully"
  },
  "diagnostics": {
    "errors": [],
    "warnings": []
  }
}
```

Failure Response:

```json
{
  "order": 3,
  "stage": "semantic",
  "status": "error",
  "output": {
    "valid": false,
    "summary": "Semantic analysis failed with 1 error(s)"
  },
  "diagnostics": {
    "errors": [
      {
        "message": "use of undeclared identifier 'y'",
        "line": 1,
        "column": 35
      }
    ],
    "warnings": []
  }
}
```

## POST /api/analyze/full

Request:

```json
{
  "code": "int main(){ return 0; }"
}
```

Success Response:

```json
{
  "status": "ok",
  "stages": {
    "lexical": {
      "order": 1,
      "stage": "lexical",
      "status": "ok",
      "output": {
        "token_count": 7,
        "tokens": [
          {
            "kind": "int",
            "value": "int",
            "line": 1,
            "column": 1
          }
        ]
      },
      "diagnostics": {
        "errors": [],
        "warnings": []
      }
    },
    "syntax": {
      "order": 2,
      "stage": "syntax",
      "status": "ok",
      "output": {
        "ast": {
          "kind": "TranslationUnitDecl",
          "loc": {},
          "range": {},
          "inner": [...]
        }
      },
      "diagnostics": {
        "errors": [],
        "warnings": []
      }
    },
    "semantic": {
      "order": 3,
      "stage": "semantic",
      "status": "ok",
      "output": {
        "valid": true,
        "summary": "Semantic analysis completed successfully"
      },
      "diagnostics": {
        "errors": [],
        "warnings": []
      }
    }
  }
}
```

Failure Response (if syntax fails):

```json
{
  "status": "error",
  "stages": {
    "lexical": {
      "order": 1,
      "stage": "lexical",
      "status": "ok",
      "output": {
        "token_count": 1,
        "tokens": [...]
      },
      "diagnostics": {
        "errors": [],
        "warnings": []
      }
    },
    "syntax": {
      "order": 2,
      "stage": "syntax",
      "status": "error",
      "output": {
        "ast": null
      },
      "diagnostics": {
        "errors": [
          {
            "message": "syntax error message"
          }
        ],
        "warnings": []
      }
    }
  }
}
```

Failure Response (if semantic fails):

```json
{
  "status": "error",
  "stages": {
    "lexical": {
      "order": 1,
      "stage": "lexical",
      "status": "ok",
      "output": {
        "token_count": 10,
        "tokens": [...]
      },
      "diagnostics": {
        "errors": [],
        "warnings": []
      }
    },
    "syntax": {
      "order": 2,
      "stage": "syntax",
      "status": "ok",
      "output": {
        "ast": {...}
      },
      "diagnostics": {
        "errors": [],
        "warnings": []
      }
    },
    "semantic": {
      "order": 3,
      "stage": "semantic",
      "status": "error",
      "output": {
        "valid": false,
        "summary": "Semantic analysis failed with 1 error(s)"
      },
      "diagnostics": {
        "errors": [
          {
            "message": "use of undeclared identifier 'y'",
            "line": 1,
            "column": 35
          }
        ],
        "warnings": []
      }
    }
  }
}
```
