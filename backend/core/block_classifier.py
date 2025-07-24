import pandas as pd


def classify_table(df: pd.DataFrame):
    cols = set(df.columns.str.lower())
    if {"title", "body", "date"}.issubset(cols):
        return "news_article_table"
    if {"job", "company", "location"}.intersection(cols):
        return "job_listings_table"
    if {"price", "product", "name"}.intersection(cols):
        return "product_listings_table"
    if {"event", "date", "location"}.intersection(cols):
        return "event_schedule_table"
    if {"review", "rating", "user"}.intersection(cols):
        return "reviews_table"
    if {"property", "address", "price"}.intersection(cols):
        return "real_estate_table"
    if {"profile", "username", "bio"}.intersection(cols):
        return "social_media_profile_table"
    if {"forum", "post", "thread"}.intersection(cols):
        return "forum_discussion_table"
    if {"image", "gallery", "caption"}.intersection(cols):
        return "image_gallery_table"
    return "generic_table"
