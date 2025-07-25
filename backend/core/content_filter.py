def filter_content(records: list[dict], criteria: dict) -> list[dict]:
    def match(row):
        for key, value in criteria.items():
            if key not in row:
                return False
            try:
                if isinstance(value, tuple) and len(value) == 2:
                    if not value[0] <= float(row[key]) <= value[1]:
                        return False
                elif isinstance(value, (int, float)):
                    if float(row[key]) < value:
                        return False
                elif isinstance(value, str):
                    if value.lower() not in str(row[key]).lower():
                        return False
            except Exception:
                return False
        return True

    return [r for r in records if match(r)]
