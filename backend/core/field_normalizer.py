def normalize_fields(records: list[dict]) -> list[dict]:
    key_map = {
        "title": ["title", "name", "product", "headline", "job", "movie", "item name"],
        "price": ["price", "cost", "$", "amount"],
        "rating": ["rating", "score", "stars", "review", "avg score"],
        "date": ["date", "year", "posted", "published", "release", "released"],
        "location": ["location", "city", "address", "region"],
        "beds": ["bedrooms", "beds"],
        "bath": ["bathrooms", "bath"],
    }

    def map_key(k):
        k = k.lower()
        for norm, variants in key_map.items():
            if any(v in k for v in variants):
                return norm
        return k

    return [{map_key(k): v for k, v in row.items()} for row in records]
