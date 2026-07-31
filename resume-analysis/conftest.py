"""
Root-level conftest.

Its presence guarantees pytest treats the project root as a rootdir and
adds it to ``sys.path`` in "prepend" import mode, so ``import app...``
resolves correctly regardless of the exact pytest version in use (in
addition to the explicit ``pythonpath = .`` set in pytest.ini).
"""
