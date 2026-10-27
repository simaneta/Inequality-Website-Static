#!/usr/bin/env python3
# scripts/build_plots.py

import os
import pandas as pd
import plotly.graph_objects as go
import plotly.io as pio

# ---------- config ----------
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(ROOT, "data")
OUT_DIR = os.path.join(ROOT, "static", "img")
os.makedirs(OUT_DIR, exist_ok=True)

groups = ['Top 10%', 'Middle 40%', 'Bottom 50%']
population_shares = [10, 40, 50]
wealth_shares = [71, 28, 1]
colors = {
    'Top 10%': '#3498db',     # blue
    'Middle 40%': '#ffbf00',  # yellow
    'Bottom 50%': '#e74c3c'   # red
}

# world data from World Inequality report 2022 (https://wir2022.wid.world)
# US data from World Inequality Database (2022) (https://wid.world/data/#countrytimeseries/shweal_p99p100_z;shweal_p50p90_z;shweal_p0p50_z;shweal_p90p100_z/US/1913/2022/eu/k/p/yearly/s)
# new_wealth data from WID 2025 (https://ourworldindata.org/grapher/wealth-share-richest-1-percent?tab=chart&time=1967..latest&country=OWID_WRL~USA)

def make_fig_stacked():
    # source: https://theunderstatement.com/post/3999331289/us-wealth-distribution-visualized
    groups_reversed = groups[::-1]
    pop_rev = population_shares[::-1]
    wealth_rev = wealth_shares[::-1]

    fig = go.Figure()

    # Population share at x=0
    for g, v in zip(groups_reversed, pop_rev):
        fig.add_trace(go.Bar(x=[0], y=[v], name=g, marker_color=colors[g], showlegend=False, width=0.5))
    # Wealth share at x=1
    for g, v in zip(groups_reversed, wealth_rev):
        fig.add_trace(go.Bar(x=[1], y=[v], name=g, marker_color=colors[g], showlegend=False, width=0.5))

    # Build segment annotations (midpoints of each stacked section)
    annos = []

    # Left column: segment labels (group names)
    y_cursor = 0
    for g, v in zip(groups_reversed, pop_rev):
        y_mid = y_cursor + v / 2
        annos.append(dict(
            x=-0.28, y=y_mid, xref='x', yref='y',
            text=g,
            showarrow=False,
            xanchor='right', align='right',
            font=dict(size=12, color='black')
        ))
        y_cursor += v

    # Right column: segment values (wealth %)
    y_cursor = 0
    for v in wealth_rev:
        y_mid = y_cursor + v / 2
        annos.append(dict(
            x=1.28, y=y_mid, xref='x', yref='y',
            text=f"{v}%",
            showarrow=False,
            xanchor='left', align='left',
            font=dict(size=12, color='black')
        ))
        y_cursor += v

    # Slanted transitions (unchanged)
    slants = [
        dict(type='path', path='M 0.248 0 L 0.248 50 L 0.752 1 L 0.752 0 Z',
             fillcolor='rgba(231, 76, 60, 0.6)', line=dict(width=0), layer='above', xref='x', yref='y'),
        dict(type='path', path='M 0.248 50 L 0.248 90 L 0.752 29 L 0.752 1 Z',
             fillcolor='rgba(255, 191, 0, 0.6)', line=dict(width=0), layer='above', xref='x', yref='y'),
        dict(type='path', path='M 0.248 90 L 0.248 100 L 0.752 100 L 0.752 29 Z',
             fillcolor='rgba(52, 152, 219, 0.6)', line=dict(width=0), layer='above', xref='x', yref='y')
    ]

    fig.update_layout(
        margin=dict(l=20, r=20, t=70, b=100),
        shapes=slants,
        xaxis=dict(
            title='',
            tickmode='array',
            showticklabels=False, 
            ticks='',  
            type='linear',
            range=[-0.5, 1.5]  # give horizontal room for outside labels
        ),
        yaxis=dict(
            range=[0, 108],
            showticklabels=False,    # hide the left % axis labels
            showgrid=False,          # no gridlines
            ticks=''                 # no ticks
        ),
        barmode='stack',
        font=dict(family='Nunito, sans-serif', size=14, color='black'),
        title='Distribution of Wealth in the United States',
        title_x=0.5,
        paper_bgcolor='rgba(0,0,0,0)',
        plot_bgcolor='rgba(0,0,0,0)',
        annotations=[
            dict(x=0, y=106, text="This %<br>of the population",
                 showarrow=False, font=dict(size=13, color='black'), xanchor='center'),
            dict(x=1, y=106, text="owns this %<br>of wealth",
                 showarrow=False, font=dict(size=13, color='black'), xanchor='center'),
            dict(
                text=(
                    "Source: World Inequality Database (2022),<br>"
                    "figure adapted from <a href='https://theunderstatement.com/post/3999331289/"
                    "us-wealth-distribution-visualized' target='_blank'>Michael DeGusta</a>"
                ),
                x=0.5, y=-0.18, xref='paper', yref='paper',
                showarrow=False,
                font=dict(size=13, color="black"),
                xanchor='center',
                align='center'
            )
        ] + annos  # add our segment labels
    )

    return fig

def make_wealth_dev():
    csv_path = os.path.join(DATA_DIR, 'wealth-share-richest-1-percent.csv') 
    df = pd.read_csv(csv_path)

    world = df[df['Entity'] == 'World']
    usa = df[df['Entity'] == 'United States']

    fig = go.Figure()
    fig.add_trace(go.Scatter(
        x=world['Year'],
        y=world['Top 1% - Share (Net national wealth) (Estimated)'],
        mode='lines+markers',
        name='World',
        line=dict(color='blue')
    ))
    fig.add_trace(go.Scatter(
        x=usa['Year'],
        y=usa['Top 1% - Share (Net national wealth) (Estimated)'],
        mode='lines+markers',
        name='United States',
        line=dict(color='#ff683e')
    ))
    fig.update_layout(
        title='Development of Wealth Owned by the Top 1%',
        xaxis_title='Year',
        yaxis_title='Top 1% Wealth Share (%)',
        paper_bgcolor='rgba(0,0,0,0)',
        plot_bgcolor='rgba(0,0,0,0)',
        font=dict(family='Nunito, sans-serif', size=14, color='black'),
        title_x=0.5,
        showlegend=True,
        margin=dict(
            l=20,  # left margin
            r=20,  # right margin
            t=70,  # top margin
            b=110
        ),  # bottom margin
        legend=dict(orientation='h', yanchor='bottom', y=1, xanchor='center', x=0.5),
        yaxis=dict(
            tickmode='array',
            tickvals=[25, 30, 35, 40],
            ticktext=['25%', '30%', '35%', '40%'],
            gridcolor='gray',
            griddash='dash',
            zeroline=False
        ),
        xaxis=dict(showgrid=True, gridcolor='lightgray'),
        annotations = [
            dict(
                x=0.5, y=-0.25, xref='paper', yref='paper',
                text=(
                    "Source: World Inequality Database (WID.world, 2025)<br>"
                    "– with major processing by "
                    "<a href='https://ourworldindata.org/grapher/wealth-share-richest-1-percent"
                    "?tab=chart&time=1967..latest&country=OWID_WRL~USA' target='_blank'>"
                    "Our World in Data</a>"
                ),
                showarrow=False,
                font=dict(size=13, color="black"),
                xanchor="center",
                align="center"
            )
        ]
    )
    return fig

def save(fig, basename, width=700, height=600, scale=2):
    png = os.path.join(OUT_DIR, f"{basename}.png")
    svg = os.path.join(OUT_DIR, f"{basename}.svg")
    pio.write_image(fig, png, format="png", width=width, height=height, scale=scale)
    pio.write_image(fig, svg, format="svg", width=width, height=height, scale=1)
    print(f"Wrote: {png}\n       {svg}")

def main():
    fig_stacked = make_fig_stacked()
    save(fig_stacked, "wealth_stacked")

    fig_wealth = make_wealth_dev()
    save(fig_wealth, "wealth_dev_top1")

if __name__ == "__main__":
    main()
