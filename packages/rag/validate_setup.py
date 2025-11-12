"""
Complete setup validation script
Runs all verification steps in sequence
"""

import sys
import os
from pathlib import Path

def print_header(text):
    """Print a formatted header"""
    print("\n" + "=" * 60)
    print(f" {text}")
    print("=" * 60)

def print_step(num, text):
    """Print a step header"""
    print(f"\n[Step {num}] {text}")
    print("-" * 60)

def check_env_file():
    """Check if .env file exists"""
    env_path = Path(".env")
    if env_path.exists():
        print("✓ .env file found")
        return True
    else:
        print("✗ .env file not found")
        print("  Action: Copy env.template to .env and configure it")
        print("  Command: cp env.template .env")
        return False

def check_imports():
    """Check if required modules can be imported"""
    try:
        from config import settings
        print(f"✓ Config loaded successfully")
        print(f"  Project: {settings.google_cloud_project}")
        print(f"  Model: {settings.embedding_model}")
        print(f"  Collection: {settings.vector_collection}")
        return True
    except Exception as e:
        print(f"✗ Failed to load config: {e}")
        return False

def run_check_data():
    """Run the data verification script"""
    print("\nRunning data verification...")
    try:
        import check_data
        check_data.main()
        return True
    except Exception as e:
        print(f"✗ Data check failed: {e}")
        return False

def run_test_embeddings():
    """Run embedding tests"""
    print("\nRunning embedding tests...")
    try:
        import asyncio
        import test_embeddings
        asyncio.run(test_embeddings.test_embeddings())
        return True
    except Exception as e:
        print(f"✗ Embedding test failed: {e}")
        return False

def run_test_retrieval():
    """Run retrieval tests"""
    print("\nRunning retrieval tests...")
    try:
        import asyncio
        import test_retrieval
        asyncio.run(test_retrieval.test_retrieval())
        return True
    except Exception as e:
        print(f"✗ Retrieval test failed: {e}")
        return False

def main():
    """Main validation flow"""
    print_header("CropSense RAG Setup Validation")
    print("\nThis script will validate your RAG system setup.")
    print("Press Ctrl+C at any time to exit.")
    
    results = []
    
    # Step 1: Check .env file
    print_step(1, "Environment Configuration")
    results.append(("Environment file", check_env_file()))
    
    # Step 2: Check imports and config
    print_step(2, "Configuration Loading")
    config_ok = check_imports()
    results.append(("Configuration", config_ok))
    
    if not config_ok:
        print("\n⚠ Cannot proceed without valid configuration")
        print("Please fix the configuration issues and try again.")
        sys.exit(1)
    
    # Step 3: Check data
    print_step(3, "Firestore Data Verification")
    try:
        data_ok = run_check_data()
        results.append(("Firestore data", data_ok))
    except KeyboardInterrupt:
        print("\n\nValidation interrupted by user")
        sys.exit(0)
    except Exception as e:
        print(f"✗ Unexpected error: {e}")
        results.append(("Firestore data", False))
    
    # Ask if user wants to continue with embedding tests
    print("\n" + "=" * 60)
    response = input("Continue with embedding tests? (y/n): ").lower()
    if response != 'y':
        print("Validation stopped by user")
        print_summary(results)
        return
    
    # Step 4: Test embeddings
    print_step(4, "Embedding Generation Test")
    try:
        embed_ok = run_test_embeddings()
        results.append(("Embeddings", embed_ok))
    except KeyboardInterrupt:
        print("\n\nValidation interrupted by user")
        sys.exit(0)
    except Exception as e:
        print(f"✗ Unexpected error: {e}")
        results.append(("Embeddings", False))
    
    # Ask if user wants to continue with retrieval tests
    print("\n" + "=" * 60)
    response = input("Continue with retrieval tests? (y/n): ").lower()
    if response != 'y':
        print("Validation stopped by user")
        print_summary(results)
        return
    
    # Step 5: Test retrieval
    print_step(5, "Retrieval Pipeline Test")
    try:
        retrieval_ok = run_test_retrieval()
        results.append(("Retrieval", retrieval_ok))
    except KeyboardInterrupt:
        print("\n\nValidation interrupted by user")
        sys.exit(0)
    except Exception as e:
        print(f"✗ Unexpected error: {e}")
        results.append(("Retrieval", False))
    
    # Print summary
    print_summary(results)

def print_summary(results):
    """Print validation summary"""
    print_header("Validation Summary")
    
    passed = sum(1 for _, ok in results if ok)
    total = len(results)
    
    for name, ok in results:
        status = "✓ PASS" if ok else "✗ FAIL"
        print(f"  {status}: {name}")
    
    print()
    print(f"Results: {passed}/{total} checks passed")
    
    if passed == total:
        print("\n🎉 All validations passed!")
        print("\nNext steps:")
        print("  1. Start the API server: python main.py")
        print("  2. Test the /query endpoint")
        print("  3. Review SETUP_GUIDE.md for detailed instructions")
    else:
        print("\n⚠ Some validations failed")
        print("\nTroubleshooting:")
        print("  1. Review error messages above")
        print("  2. Check SETUP_GUIDE.md for solutions")
        print("  3. Verify .env configuration")
        print("  4. Ensure Google Cloud authentication is set up")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nValidation interrupted by user")
        sys.exit(0)
    except Exception as e:
        print(f"\n✗ Fatal error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

