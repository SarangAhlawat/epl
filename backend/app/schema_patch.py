"""
Apply additive schema changes for existing databases.

SQLAlchemy create_all() does not ALTER existing tables, so new ORM columns
would otherwise cause UndefinedColumn errors against an old PostgreSQL DB.
"""

from sqlalchemy import text
from sqlalchemy.engine import Engine


def apply_schema_patches(engine: Engine) -> None:

    dialect = engine.dialect.name

    if dialect == "postgresql":

        stmts = [

            text(

                "ALTER TABLE events "

                "ADD COLUMN IF NOT EXISTS form_published BOOLEAN DEFAULT FALSE"

            ),

            text(

                "ALTER TABLE attendees "

                "ADD COLUMN IF NOT EXISTS pass_mail_status VARCHAR"

            ),

            text(

                "ALTER TABLE attendees "

                "ADD COLUMN IF NOT EXISTS other_mail_status VARCHAR"

            ),

            text(

                """

                CREATE TABLE IF NOT EXISTS mailing_campaigns (

                    id UUID PRIMARY KEY,

                    event_id UUID NOT NULL

                        REFERENCES events(id) ON DELETE CASCADE,

                    campaign_type VARCHAR NOT NULL,

                    subject VARCHAR,

                    html_body TEXT,

                    attachment_urls JSONB,

                    log_lines JSONB,

                    created_at TIMESTAMP WITHOUT TIME ZONE

                )

                """

            ),

        ]

        with engine.begin() as conn:

            for stmt in stmts:

                conn.execute(stmt)

        return

    if dialect == "sqlite":

        with engine.begin() as conn:

            cols = conn.execute(

                text("PRAGMA table_info(events)")

            ).fetchall()

            names = {row[1] for row in cols}

            if "form_published" not in names:

                conn.execute(

                    text(

                        "ALTER TABLE events ADD COLUMN form_published "

                        "BOOLEAN DEFAULT 0"

                    )

                )

            acols = conn.execute(

                text("PRAGMA table_info(attendees)")

            ).fetchall()

            anames = {row[1] for row in acols}

            if "pass_mail_status" not in anames:

                conn.execute(

                    text(

                        "ALTER TABLE attendees ADD COLUMN pass_mail_status VARCHAR"

                    )

                )

            if "other_mail_status" not in anames:

                conn.execute(

                    text(

                        "ALTER TABLE attendees ADD COLUMN other_mail_status VARCHAR"

                    )

                )

        return
