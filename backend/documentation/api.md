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
  "stage": "lexical",
  "status": "ok",
  "raw": "...clang token dump...",
  "token_count": 1,
  "tokens": [
    {
      "kind": "identifier",
      "value": "main",
      "line": 1,
      "column": 5
    }
  ]
}
```

Failure Response:

```json
{
  "stage": "lexical",
  "status": "error",
  "raw": "clang error output",
  "token_count": 0,
  "tokens": []
}
```
