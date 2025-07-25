from enum import Enum


class ContentType(str, Enum):
    TABLE = "table"
    DIV_GRID = "div_grid"
    UNIVERSAL_GRID = "universal_grid"
    PRODUCT_LISTING = "product_listing"
    JOB_LISTING = "job_listing"
    ARTICLE = "article"
    REVIEW = "review"
    REAL_ESTATE = "real_estate"
    ACADEMIC_DATA = "academic_data"
    BLOG = "blog"
    FORUM = "forum"
    JSON_LD = "json_ld"
    PROFILE = "profile"
    UNKNOWN = "unknown"
