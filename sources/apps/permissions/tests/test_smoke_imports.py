from fastapi import FastAPI


def test_composition_root_exposes_fastapi_app():
    from main import app, create_app

    assert isinstance(app, FastAPI)
    assert callable(create_app)
