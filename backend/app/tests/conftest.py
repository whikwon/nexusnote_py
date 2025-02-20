import asyncio
import os
from collections.abc import Generator
from pathlib import Path
from shutil import rmtree

import pytest
import pytest_asyncio
from fastapi.testclient import TestClient

from app.core.config import settings
from app.core.db import _MongoClientSingleton, get_mongodb_client, get_mongodb_engine
from app.main import app

TEST_MONGO_DATABASE = "test"
settings.MONGO_DATABASE = TEST_MONGO_DATABASE

TEST_LANCE_URI = "lancedb/test"
settings.LANCE_URI = TEST_LANCE_URI


@pytest.fixture(scope="session")
def event_loop():
    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(scope="session")
async def db() -> Generator:
    db = get_mongodb_client()
    _MongoClientSingleton._instance.mongo_client.get_io_loop = asyncio.get_event_loop
    yield db
    await db.client.drop_database(TEST_MONGO_DATABASE)


@pytest_asyncio.fixture(scope="session")
async def engine() -> Generator:
    yield get_mongodb_engine()  # This will now use the TEST_DATABASE name


@pytest.fixture(scope="session")
def client(db) -> Generator:
    with TestClient(app) as c:
        yield c


@pytest.fixture(scope="session")
def asset_dir():
    return Path(__file__).parent / "assets"


@pytest.fixture(scope="session")
def pdf_path(asset_dir):
    return asset_dir / "2501.00663v1.pdf"


@pytest.fixture(scope="session", autouse=True)
def set_temp_document_dir(tmp_path_factory):
    # Create a temporary directory for documents
    temp_dir = tmp_path_factory.mktemp("documents")
    settings.DOCUMENT_DIR_PATH = temp_dir
    yield temp_dir


def pytest_sessionfinish(session, exitstatus):
    """Hook to run after the entire test session finishes."""
    if os.path.exists(TEST_LANCE_URI):
        rmtree(TEST_LANCE_URI, ignore_errors=True)
