package com.kingsgambit.game;

import android.app.Activity;
import android.os.Bundle;
import android.view.View;
import android.webkit.WebView;

public final class MainActivity extends Activity {
    private WebView game;
    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_FULLSCREEN
            | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY);
        game = new WebView(this);
        game.getSettings().setJavaScriptEnabled(true);
        game.getSettings().setDomStorageEnabled(true);
        game.getSettings().setAllowContentAccess(false);
        setContentView(game);
        game.loadUrl("file:///android_asset/index.html");
    }
    @Override public void onBackPressed() {
        game.evaluateJavascript("window.handleBack ? handleBack() : false", result -> {
            if (!"true".equals(result)) finish();
        });
    }
    @Override protected void onPause() { game.evaluateJavascript("window.pauseBattle?.()", null); game.onPause(); super.onPause(); }
    @Override protected void onResume() { super.onResume(); if (game != null) game.onResume(); }
}
